/* SERVER ONLY. Where a student has got to in each trainer, kept with their account.
 *
 * The trainers (English, German, PTE, the IELTS skill labs) save progress in
 * the browser's own storage. That is lost whenever the browser forgets it: a
 * different phone, a link opened inside WhatsApp or Instagram (their built-in
 * browsers throw storage away), private mode, or cleared history — and the
 * student is back at the beginning. So a copy is kept here, per student and
 * per trainer, and handed back to the page when it is opened again
 * (lib/trainer-page.ts).
 *
 * Kept in the `attempts` table like the module settings (lib/access.ts), so
 * nothing has to be set up in the database: skill "X-progress", test_id
 * "progress:<trainer>", and in `answers` the trainer's own saved keys:
 * { at: epoch ms of the last change, data: { storageKey: value } }.
 * The skill has a dash, so lib/attempts.ts leaves these rows out of every
 * result, and the test_id matches no test, so no leaderboard sees them.
 */

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SKILL = "X-progress";

/** Biggest saved copy accepted for one trainer (the largest real one is far smaller). */
export const MAX_BYTES = 400_000;

export const progressReady = () => Boolean(BASE && KEY);

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

export type Saved = { at: number; data: Record<string, string> };

const testId = (trainer: string) => `progress:${trainer}`;
const where = (studentId: string, trainer: string) =>
  `student_id=eq.${encodeURIComponent(studentId)}&skill=eq.${SKILL}&test_id=eq.${encodeURIComponent(testId(trainer))}`;

/** Only plain string keys and values — exactly what browser storage holds. */
export function cleanData(x: unknown): Record<string, string> | null {
  if (!x || typeof x !== "object" || Array.isArray(x)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    if (typeof v !== "string" || !k || k.length > 200) continue;
    out[k] = v;
  }
  return out;
}

export async function getProgress(studentId: string, trainer: string): Promise<Saved | null> {
  const rows = (await rest(`attempts?select=answers&${where(studentId, trainer)}&order=submitted_at.desc&limit=1`)) as
    { answers: { at?: unknown; data?: unknown } | null }[] | null;
  const a = Array.isArray(rows) ? rows[0]?.answers : null;
  const data = cleanData(a?.data);
  if (!data) return null;
  return { at: typeof a?.at === "number" ? a.at : 0, data };
}

export async function putProgress(studentId: string, trainer: string, saved: Saved): Promise<void> {
  const answers = { at: saved.at, data: saved.data };
  const existing = (await rest(`attempts?select=id&${where(studentId, trainer)}&limit=1`)) as { id: string }[] | null;
  if (Array.isArray(existing) && existing.length) {
    await rest(`attempts?${where(studentId, trainer)}`, {
      method: "PATCH",
      body: JSON.stringify({ answers, submitted_at: new Date().toISOString() }),
    });
    return;
  }
  await rest("attempts", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      student_id: studentId, test_id: testId(trainer), skill: SKILL,
      raw_score: 0, total: 0, band: 0,
      answers, per_question: [], seconds_used: null,
    }),
  });
}
