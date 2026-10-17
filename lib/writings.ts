/* SERVER ONLY. Writing a student finished, and the teacher's marking of it.
 * Never import this from a file marked "use client". */

export type Mark = { s: number; e: number; kind: "err" | "good"; note?: string };
export type Criteria = { ta?: number | null; cc?: number | null; lr?: number | null; gra?: number | null };

export type Writing = {
  id: string;
  student_id: string;
  task_id: string;
  kind: "task1" | "gt1" | "task2";
  question: string;
  body: string;
  words: number;
  seconds_used: number | null;
  auto_band: number | null;
  status: "submitted" | "checked";
  marks: Mark[];
  teacher_band: number | null;
  criteria: Criteria | null;
  teacher_note: string | null;
  submitted_at: string;
  checked_at: string | null;
  students?: { full_name?: string; code?: string; batch?: string | null } | null;
};

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const writingsReady = () => Boolean(BASE && KEY);

async function rest(path: string, init: RequestInit = {}) {
  if (!writingsReady()) throw new Error("Supabase is not configured");
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

const okId = (id: string) => /^[0-9a-f-]{10,40}$/i.test(id);

/** A new piece of writing, or a re-check of one the teacher has not marked yet. */
export async function saveWriting(w: {
  id?: string; student_id: string; task_id: string; kind: string; question: string;
  body: string; words: number; seconds_used?: number | null; auto_band?: number | null;
}): Promise<string> {
  const row = {
    task_id: w.task_id, kind: w.kind, question: w.question, body: w.body, words: w.words,
    seconds_used: w.seconds_used ?? null, auto_band: w.auto_band ?? null,
  };
  if (w.id && okId(w.id)) {
    // only the student's own, and only while unmarked — a checked paper is a record
    const rows = await rest(
      `writings?id=eq.${w.id}&student_id=eq.${encodeURIComponent(w.student_id)}&status=eq.submitted`,
      { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...row, submitted_at: new Date().toISOString() }) },
    );
    if (Array.isArray(rows) && rows[0]) return rows[0].id;
  }
  const rows = await rest("writings", {
    method: "POST", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...row, student_id: w.student_id }),
  });
  return Array.isArray(rows) ? rows[0].id : (rows as Writing).id;
}

const LIST = "id,student_id,task_id,kind,question,words,auto_band,status,teacher_band,submitted_at,checked_at";

export async function writingsForStudent(studentId: string, limit = 100): Promise<Writing[]> {
  const rows = await rest(
    `writings?select=${LIST}&student_id=eq.${encodeURIComponent(studentId)}&order=submitted_at.desc&limit=${limit}`,
  );
  return Array.isArray(rows) ? rows : [];
}

/** Waiting to be checked first, oldest first, then the recently checked. */
export async function recentWritings(limit = 200): Promise<Writing[]> {
  const rows = await rest(
    `writings?select=${LIST},students(full_name,code,batch)&order=status.desc,submitted_at.desc&limit=${limit}`,
  );
  return Array.isArray(rows) ? rows : [];
}

export async function writingById(id: string): Promise<Writing | null> {
  if (!okId(id)) return null;
  const rows = await rest(`writings?select=*,students(full_name,code,batch)&id=eq.${id}&limit=1`);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

/** Keep only marks that fit the text, in order, without overlaps. */
export function cleanMarks(marks: unknown, length: number): Mark[] {
  if (!Array.isArray(marks)) return [];
  const out: Mark[] = [];
  for (const m of marks as Mark[]) {
    const s = Math.floor(Number(m?.s)), e = Math.floor(Number(m?.e));
    if (!Number.isFinite(s) || !Number.isFinite(e) || s < 0 || e > length || e <= s) continue;
    out.push({ s, e, kind: m.kind === "good" ? "good" : "err", ...(m.note ? { note: String(m.note).slice(0, 300) } : {}) });
  }
  out.sort((a, b) => a.s - b.s);
  return out.filter((m, i) => i === 0 || m.s >= out[i - 1].e).slice(0, 400);
}

const band = (v: unknown) => {
  const n = Number(v);
  return v === "" || v == null || !Number.isFinite(n) ? null : Math.max(0, Math.min(9, Math.round(n * 2) / 2));
};

export async function markWriting(id: string, m: {
  marks: unknown; teacher_band: unknown; criteria: Criteria | null; teacher_note: string; done: boolean;
}): Promise<void> {
  const w = await writingById(id);
  if (!w) throw new Error("That writing is not there any more.");
  await rest(`writings?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      marks: cleanMarks(m.marks, w.body.length),
      teacher_band: band(m.teacher_band),
      criteria: m.criteria
        ? { ta: band(m.criteria.ta), cc: band(m.criteria.cc), lr: band(m.criteria.lr), gra: band(m.criteria.gra) }
        : null,
      teacher_note: m.teacher_note.slice(0, 4000) || null,
      status: m.done ? "checked" : "submitted",
      checked_at: m.done ? new Date().toISOString() : null,
    }),
  });
}
