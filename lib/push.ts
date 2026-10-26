/* SERVER ONLY. Practice reminders sent as push notifications.
 *
 * A student turns them on from the practice pages (components/practice/
 * PushOptIn.tsx). Their browser gives us a "subscription" — an address at
 * Google, Apple or Mozilla's push service plus two keys — and we keep it here.
 * To send, we encrypt the message for that browser and post it to the
 * address (the web-push package does both). The phone shows it even when the
 * site is closed. On iPhone this only works once the site has been added to
 * the home screen (iOS 16.4 or later); that is Apple's rule.
 *
 * Kept in the `attempts` table like the other settings, so nothing has to be
 * set up in the database: skill "X-push", test_id "push:<hash of address>"
 * (one row per browser, so a phone handed to another student moves to that
 * student), and the subscription in `answers`.
 *
 * Needs three settings in Vercel: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (a key
 * pair made once with `npx web-push generate-vapid-keys`) and, optionally,
 * VAPID_SUBJECT (mailto: address the push services can contact).
 */
import crypto from "node:crypto";
import webpush from "web-push";
import { listStudents } from "@/lib/students";
import { activeAreas, allAccess, homeFor, type Area } from "@/lib/access";

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SKILL = "X-push";

export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY ?? "";
export const pushReady = () => Boolean(BASE && KEY && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || `mailto:${process.env.OWNER_EMAIL || "info@pioneermorinda.com"}`,
    process.env.VAPID_PUBLIC_KEY ?? "",
    process.env.VAPID_PRIVATE_KEY ?? "",
  );
  configured = true;
}

async function rest(path: string, init: RequestInit = {}) {
  if (!BASE || !KEY) throw new Error("Supabase is not configured");
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 300)}`);
  /* A save that asks for no reply ("return=minimal") gets an empty 201 back;
     reading that as JSON would throw after the save had already worked. */
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

/** A subscription exactly as a browser sends it — anything else is refused. */
export function cleanSub(x: unknown): Sub | null {
  const s = x as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  if (!s || typeof s.endpoint !== "string" || !/^https:\/\/[^\s]{10,1000}$/.test(s.endpoint)) return null;
  const p = s.keys?.p256dh, a = s.keys?.auth;
  if (typeof p !== "string" || typeof a !== "string" || p.length > 200 || a.length > 100) return null;
  return { endpoint: s.endpoint, keys: { p256dh: p, auth: a } };
}

const testId = (endpoint: string) =>
  "push:" + crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 32);

/** Keep this browser for this student (and take it away from whoever had it before). */
export async function saveSub(studentId: string, sub: Sub, ua: string): Promise<void> {
  const tid = testId(sub.endpoint);
  await rest(`attempts?skill=eq.${SKILL}&test_id=eq.${tid}`, { method: "DELETE" });
  await rest("attempts", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      student_id: studentId, test_id: tid, skill: SKILL,
      raw_score: 0, total: 0, band: 0,
      answers: { ...sub, ua: ua.slice(0, 200) }, per_question: [], seconds_used: null,
    }),
  });
}

export async function removeSub(endpoint: string): Promise<void> {
  await rest(`attempts?skill=eq.${SKILL}&test_id=eq.${testId(endpoint)}`, { method: "DELETE" });
}

type Row = { id: string; student_id: string; answers: unknown };

/** Every browser that has reminders on, with whose it is. */
export async function allSubs(): Promise<{ id: string; student_id: string; sub: Sub }[]> {
  const rows = (await rest(`attempts?select=id,student_id,answers&skill=eq.${SKILL}&limit=5000`)) as Row[] | null;
  const out: { id: string; student_id: string; sub: Sub }[] = [];
  for (const r of Array.isArray(rows) ? rows : []) {
    const sub = cleanSub(r.answers);
    if (sub) out.push({ id: r.id, student_id: r.student_id, sub });
  }
  return out;
}

/** Students who did anything since `sinceIso`: a test, a writing, a trainer save. */
export async function activeSince(sinceIso: string): Promise<Set<string>> {
  const rows = (await rest(
    `attempts?select=student_id&submitted_at=gte.${encodeURIComponent(sinceIso)}` +
    `&skill=neq.${SKILL}&skill=neq.X-access&limit=10000`,
  )) as { student_id: string }[] | null;
  return new Set((Array.isArray(rows) ? rows : []).map((r) => r.student_id));
}

export type Message = { title: string; body: string; url?: string; tag?: string };

/**
 * Send one message per student (each may have several phones). `msgFor`
 * returns that student's message, or null to skip them. Browsers that have
 * gone (uninstalled, notifications switched off) are removed as we find them.
 */
export async function sendEach(
  subs: { id: string; student_id: string; sub: Sub }[],
  msgFor: (studentId: string) => Message | null,
): Promise<{ sent: number; failed: number; removed: number; students: number }> {
  configure();
  let sent = 0, failed = 0, removed = 0;
  const students = new Set<string>();
  const queue = subs.map((s) => ({ s, m: msgFor(s.student_id) })).filter((x) => x.m);
  for (let i = 0; i < queue.length; i += 25) {
    await Promise.all(queue.slice(i, i + 25).map(async ({ s, m }) => {
      try {
        await webpush.sendNotification(s.sub, JSON.stringify(m), { TTL: 6 * 3600, urgency: "normal" });
        sent++; students.add(s.student_id);
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          removed++;
          await rest(`attempts?id=eq.${encodeURIComponent(s.id)}&skill=eq.${SKILL}`, { method: "DELETE" }).catch(() => {});
        } else {
          failed++;
          console.error("push", code, String((e as Error).message).slice(0, 200));
        }
      }
    }));
  }
  return { sent, failed, removed, students: students.size };
}

/* ---------- who gets what ---------- */


export type Person = { name: string; areas: Area[] | null; home: string };

/**
 * Every active student who has reminders on, with their name, their modules
 * (null = no modules set, which opens everything) and the page a tap on the
 * notification should open. A student whose course has run out, or whose
 * login the teacher switched off, is left out.
 */
export async function audience(): Promise<{ subs: Awaited<ReturnType<typeof allSubs>>; people: Map<string, Person> }> {
  const [subs, students, access] = await Promise.all([allSubs(), listStudents(), allAccess()]);
  const people = new Map<string, Person>();
  for (const s of students) {
    if (!s.active) continue;
    const row = access[s.id];
    const areas = row ? activeAreas(row) : null;
    if (areas && !areas.length) continue;           // nothing open any more
    people.set(s.id, { name: s.full_name, areas, home: homeFor({ role: "student", access: areas ?? undefined }) });
  }
  return { subs: subs.filter((x) => people.has(x.student_id)), people };
}
