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

export type Area = "academic" | "gt" | "english" | "pte";

export const AREAS: { key: Area; label: string; home: string }[] = [
  { key: "academic", label: "IELTS Academic", home: "/practice?skill=AR" },
  { key: "gt", label: "IELTS General Training", home: "/practice?skill=GR" },
  { key: "english", label: "English", home: "/practice/english" },
  { key: "pte", label: "PTE", home: "/practice/pte" },
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

type Row = { id: string; student_id: string; answers: { access?: unknown } | null };

/** This student's modules, or undefined for "no settings — everything". */
export async function getAccess(studentId: string): Promise<Area[] | undefined> {
  const rows = (await rest(
    `attempts?select=id,student_id,answers&student_id=eq.${encodeURIComponent(studentId)}` +
    `&skill=eq.${SKILL}&order=submitted_at.desc&limit=1`,
  )) as Row[] | null;
  const r = Array.isArray(rows) ? rows[0] : undefined;
  return r ? cleanAreas(r.answers?.access) : undefined;
}

/** Every student's settings at once, for the teacher's list. */
export async function allAccess(): Promise<Record<string, Area[]>> {
  const rows = (await rest(
    `attempts?select=id,student_id,answers&skill=eq.${SKILL}&order=submitted_at.desc&limit=2000`,
  )) as Row[] | null;
  const out: Record<string, Area[]> = {};
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!(r.student_id in out)) out[r.student_id] = cleanAreas(r.answers?.access);
  }
  return out;
}

export async function setAccess(studentId: string, areas: Area[]): Promise<void> {
  const access = cleanAreas(areas);
  const existing = (await rest(
    `attempts?select=id&student_id=eq.${encodeURIComponent(studentId)}&skill=eq.${SKILL}`,
  )) as { id: string }[] | null;
  if (Array.isArray(existing) && existing.length) {
    await rest(`attempts?student_id=eq.${encodeURIComponent(studentId)}&skill=eq.${SKILL}`, {
      method: "PATCH",
      body: JSON.stringify({ answers: { access }, submitted_at: new Date().toISOString() }),
    });
    return;
  }
  await rest("attempts", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      student_id: studentId, test_id: "access", skill: SKILL,
      raw_score: 0, total: 0, band: 0,
      answers: { access }, per_question: [], seconds_used: null,
    }),
  });
}

/** What an online course opens. */
export function areasForCourse(slug: string): Area[] {
  if (/pte/i.test(slug)) return ["pte"];
  if (/english|spoken/i.test(slug)) return ["english"];
  if (/ielts/i.test(slug)) return ["academic", "gt"];
  return [];
}
