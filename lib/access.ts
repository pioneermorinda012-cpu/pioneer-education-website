/* SERVER ONLY. Which modules a student's login opens.
 *
 * A student enrolled for IELTS Academic should see Academic, a GT student GT,
 * a Spoken English student English — not the whole centre's material.
 *
 * Kept in the existing `attempts` table, like saved writing, so nothing has to
 * be set up in the database: one row per student with skill "X-access",
 * test_id "access" and the list in `answers.access`. lib/attempts.ts leaves
 * these rows out of every test result.
 *
 * A student with no row opens everything. That is deliberate: every login made
 * before this existed keeps working exactly as it did until the teacher ticks
 * its boxes.
 *
 * The list is copied into the signed session cookie at sign-in, so a page can
 * check it without a database call. A change made by the teacher therefore
 * takes effect the next time the student signs in.
 */

import type { Session } from "@/lib/session";
import type { SkillCode } from "@/lib/catalogue";

export type Area = "academic" | "gt" | "english" | "pte" | "german";

export const AREAS: { key: Area; label: string; home: string }[] = [
  { key: "academic", label: "IELTS Academic", home: "/practice?skill=AR" },
  { key: "gt", label: "IELTS General Training", home: "/practice?skill=GR" },
  { key: "english", label: "English", home: "/practice/english" },
  { key: "pte", label: "PTE", home: "/practice/pte" },
  { key: "german", label: "German", home: "/practice/german" },
];

/** Listening is the same paper for Academic and GT, so both open it. */
export const SKILL_AREAS: Record<SkillCode, Area[]> = {
  AL: ["academic", "gt"],
  AR: ["academic"],
  GR: ["gt"],
  GL: ["gt"],
};

/** Task 2 is the same essay for both; Task 1 is not. */
export const WRITING_AREAS: Record<"task1" | "gt1" | "task2", Area[]> = {
  task1: ["academic"],
  gt1: ["gt"],
  task2: ["academic", "gt"],
};

export const isArea = (x: unknown): x is Area => AREAS.some((a) => a.key === x);

/** Clean whatever came from a form or a row: known areas only, no repeats, in order. */
export function cleanAreas(x: unknown): Area[] {
  const given = Array.isArray(x) ? x : [];
  return AREAS.map((a) => a.key).filter((k) => given.includes(k));
}

/** May this session open something that belongs to any of `need`? */
export function allows(s: Pick<Session, "role" | "access"> | null | undefined, need: Area[]): boolean {
  if (!s) return false;
  if (s.role === "teacher") return true;
  if (!Array.isArray(s.access)) return true;   // no settings yet: everything, as before
  return need.some((a) => s.access!.includes(a));
}

/** Where to send a student when the page they asked for is not in their course. */
export function homeFor(s: Pick<Session, "role" | "access">): string {
  if (s.role === "teacher" || !Array.isArray(s.access)) return "/practice?skill=AL";
  return AREAS.find((a) => s.access!.includes(a.key))?.home ?? "/practice/locked";
}

/* ---------- the stored row ---------- */

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SKILL = "X-access";

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
  return res.status === 204 ? null : res.json();
}

/* What the row keeps in `answers`:
 *   access    the modules this login has, e.g. ["academic", "gt"]
 *   until     for a module bought online, when it runs out (ISO date).
 *             A module with no date never runs out (the teacher's own).
 *   payments  Razorpay payment ids already counted, so a webhook Razorpay
 *             sends twice does not add the time twice. */
export type AccessRow = { access: Area[]; until: Partial<Record<Area, string>>; payments: string[] };

type Row = { id: string; student_id: string; answers: { access?: unknown; until?: unknown; payments?: unknown } | null };

function parse(r: Row): AccessRow {
  const access = cleanAreas(r.answers?.access);
  const until: Partial<Record<Area, string>> = {};
  const u = r.answers?.until;
  if (u && typeof u === "object") {
    for (const [k, v] of Object.entries(u as Record<string, unknown>)) {
      if (isArea(k) && typeof v === "string" && !Number.isNaN(Date.parse(v))) until[k] = v;
    }
  }
  const payments = Array.isArray(r.answers?.payments)
    ? (r.answers!.payments as unknown[]).filter((x): x is string => typeof x === "string").slice(-50)
    : [];
  return { access, until, payments };
}

/** The modules that are open right now: listed, and not run out. */
export function activeAreas(row: AccessRow, now = Date.now()): Area[] {
  return row.access.filter((a) => !row.until[a] || Date.parse(row.until[a]!) > now);
}

/** The whole stored row, or undefined when there is none (= everything, as before). */
export async function getAccessRow(studentId: string): Promise<AccessRow | undefined> {
  const rows = (await rest(
    `attempts?select=id,student_id,answers&student_id=eq.${encodeURIComponent(studentId)}` +
    `&skill=eq.${SKILL}&order=submitted_at.desc&limit=1`,
  )) as Row[] | null;
  const r = Array.isArray(rows) ? rows[0] : undefined;
  return r ? parse(r) : undefined;
}

/** This student's open modules, or undefined for "no settings — everything". */
export async function getAccess(studentId: string): Promise<Area[] | undefined> {
  const row = await getAccessRow(studentId);
  return row ? activeAreas(row) : undefined;
}

/** Every student's settings at once, for the teacher's list. */
export async function allAccess(): Promise<Record<string, AccessRow>> {
  const rows = (await rest(
    `attempts?select=id,student_id,answers&skill=eq.${SKILL}&order=submitted_at.desc&limit=2000`,
  )) as Row[] | null;
  const out: Record<string, AccessRow> = {};
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!(r.student_id in out)) out[r.student_id] = parse(r);
  }
  return out;
}

async function writeRow(studentId: string, row: AccessRow): Promise<void> {
  const answers = { access: cleanAreas(row.access), until: row.until, payments: row.payments.slice(-50) };
  const existing = (await rest(
    `attempts?select=id&student_id=eq.${encodeURIComponent(studentId)}&skill=eq.${SKILL}`,
  )) as { id: string }[] | null;
  if (Array.isArray(existing) && existing.length) {
    await rest(`attempts?student_id=eq.${encodeURIComponent(studentId)}&skill=eq.${SKILL}`, {
      method: "PATCH",
      body: JSON.stringify({ answers, submitted_at: new Date().toISOString() }),
    });
    return;
  }
  await rest("attempts", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      student_id: studentId, test_id: "access", skill: SKILL,
      raw_score: 0, total: 0, band: 0,
      answers, per_question: [], seconds_used: null,
    }),
  });
}

/**
 * The teacher's ticks. A module that stays ticked keeps its end date; one
 * ticked by the teacher is open with no end date; `clear` removes the end
 * date from the modules named in it.
 */
export async function setAccess(studentId: string, areas: Area[], clear: Area[] = []): Promise<void> {
  const before = (await getAccessRow(studentId)) ?? { access: [], until: {}, payments: [] };
  const access = cleanAreas(areas);
  const until: Partial<Record<Area, string>> = {};
  for (const a of access) {
    if (before.until[a] && !clear.includes(a)) until[a] = before.until[a];
  }
  await writeRow(studentId, { access, until, payments: before.payments });
}

/** Calendar months later, kept inside the month: 31 Jan + 1 month = 28/29 Feb. */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

/**
 * A paid plan: open `areas` for `months`, counted from today — or from the
 * current end date, when the student renews before it runs out. A module the
 * student already has with no end date stays that way. Paying twice with the
 * same payment id changes nothing the second time.
 *
 * `row` is the student's current row, or undefined for a student without
 * one; the caller decides whether such a student should get a row at all.
 * Returns the new end dates, for the email.
 */
export function addPaidTime(
  row: AccessRow, areas: Area[], months: number, paymentId: string, now = new Date(),
): { row: AccessRow; until: Partial<Record<Area, string>>; already: boolean } {
  if (row.payments.includes(paymentId)) return { row, until: {}, already: true };
  const next: AccessRow = { access: [...row.access], until: { ...row.until }, payments: [...row.payments, paymentId] };
  const until: Partial<Record<Area, string>> = {};
  for (const a of areas) {
    const has = next.access.includes(a);
    if (has && !next.until[a]) continue; // open with no end date already
    const current = has && next.until[a] ? new Date(next.until[a]!) : null;
    const start = current && current.getTime() > now.getTime() ? current : now;
    const end = addMonths(start, months).toISOString();
    if (!has) next.access.push(a);
    next.until[a] = end;
    until[a] = end;
  }
  next.access = cleanAreas(next.access);
  return { row: next, until, already: false };
}

export async function saveAccessRow(studentId: string, row: AccessRow): Promise<void> {
  await writeRow(studentId, row);
}

/** What an online course opens. */
export function areasForCourse(slug: string): Area[] {
  if (/pte/i.test(slug)) return ["pte"];
  if (/german|deutsch/i.test(slug)) return ["german"];
  if (/english|spoken/i.test(slug)) return ["english"];
  if (/ielts/i.test(slug)) return ["academic", "gt"];
  return [];
}
