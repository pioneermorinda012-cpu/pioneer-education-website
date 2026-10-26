/* SERVER ONLY. Writing a student finished, and the teacher's marking of it.
 * Never import this from a file marked "use client".
 *
 * Kept in the existing `attempts` table, so nothing has to be set up in the
 * database: a writing row has skill "W-task1", "W-gt1" or "W-task2", test_id
 * is the writing task, raw_score the word count, band the instant check's
 * estimate, and everything else — the question, the text, the teacher's pen
 * marks, band and comment — sits in the `answers` column. lib/attempts.ts
 * leaves these rows out of every test result. */

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

/* what is kept in attempts.answers */
type Stored = {
  question: string; body: string; status: "submitted" | "checked"; marks: Mark[];
  teacher_band: number | null; criteria: Criteria | null; teacher_note: string | null; checked_at: string | null;
};
type Row = {
  id: string; student_id: string; test_id: string; skill: string; raw_score: number; band: number;
  seconds_used: number | null; submitted_at: string; answers: Partial<Stored>;
  students?: Writing["students"];
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
  /* A save that asks for no reply ("return=minimal") gets an empty 201 back;
     reading that as JSON would throw after the save had already worked. */
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const okId = (id: string) => /^[0-9a-f-]{10,40}$/i.test(id);
const IS_WRITING = "skill=like.W-*";
const COLS = "id,student_id,test_id,skill,raw_score,band,seconds_used,submitted_at,answers";

function toWriting(r: Row): Writing {
  const a = r.answers ?? {};
  return {
    id: r.id,
    student_id: r.student_id,
    task_id: r.test_id,
    kind: (r.skill.slice(2) as Writing["kind"]) || "task2",
    question: a.question ?? "",
    body: a.body ?? "",
    words: r.raw_score,
    seconds_used: r.seconds_used,
    auto_band: r.band == null ? null : Number(r.band),
    status: a.status === "checked" ? "checked" : "submitted",
    marks: Array.isArray(a.marks) ? a.marks : [],
    teacher_band: a.teacher_band ?? null,
    criteria: a.criteria ?? null,
    teacher_note: a.teacher_note ?? null,
    submitted_at: r.submitted_at,
    checked_at: a.checked_at ?? null,
    ...(r.students !== undefined ? { students: r.students } : {}),
  };
}
const many = (rows: unknown) => (Array.isArray(rows) ? (rows as Row[]).map(toWriting) : []);

/** A new piece of writing, or a re-check of one the teacher has not marked yet. */
export async function saveWriting(w: {
  id?: string; student_id: string; task_id: string; kind: string; question: string;
  body: string; words: number; seconds_used?: number | null; auto_band?: number | null;
}): Promise<string> {
  const answers: Stored = {
    question: w.question, body: w.body, status: "submitted", marks: [],
    teacher_band: null, criteria: null, teacher_note: null, checked_at: null,
  };
  const row = {
    test_id: w.task_id, skill: `W-${w.kind}`, raw_score: w.words, total: w.words,
    band: Math.max(0, Math.min(9, Number(w.auto_band ?? 0) || 0)),
    seconds_used: w.seconds_used ?? null, answers, per_question: [],
  };
  if (w.id && okId(w.id)) {
    // only the student's own, and only while unmarked — a checked paper is a record
    const rows = await rest(
      `attempts?id=eq.${w.id}&student_id=eq.${encodeURIComponent(w.student_id)}&${IS_WRITING}&answers->>status=eq.submitted`,
      { method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ ...row, submitted_at: new Date().toISOString() }) },
    );
    if (Array.isArray(rows) && rows[0]) return rows[0].id;
  }
  const rows = await rest("attempts", {
    method: "POST", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...row, student_id: w.student_id }),
  });
  return Array.isArray(rows) ? rows[0].id : (rows as Row).id;
}

export async function writingsForStudent(studentId: string, limit = 100): Promise<Writing[]> {
  return many(await rest(
    `attempts?select=${COLS}&student_id=eq.${encodeURIComponent(studentId)}&${IS_WRITING}&order=submitted_at.desc&limit=${limit}`,
  ));
}

/** One student's saved answers to one task, newest first. */
export async function writingsForStudentTask(studentId: string, taskId: string): Promise<Writing[]> {
  return many(await rest(
    `attempts?select=${COLS}&student_id=eq.${encodeURIComponent(studentId)}` +
    `&test_id=eq.${encodeURIComponent(taskId)}&${IS_WRITING}&order=submitted_at.desc&limit=50`,
  ));
}

/** Waiting to be checked first, then the recently checked. */
export async function recentWritings(limit = 200): Promise<Writing[]> {
  const list = many(await rest(
    `attempts?select=${COLS},students(full_name,code,batch)&${IS_WRITING}&order=submitted_at.desc&limit=${limit}`,
  ));
  return [...list.filter((w) => w.status !== "checked"), ...list.filter((w) => w.status === "checked")];
}

export async function writingById(id: string): Promise<Writing | null> {
  if (!okId(id)) return null;
  const rows = await rest(`attempts?select=${COLS},students(full_name,code,batch)&id=eq.${id}&${IS_WRITING}&limit=1`);
  return Array.isArray(rows) && rows[0] ? toWriting(rows[0]) : null;
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
  const answers: Stored = {
    question: w.question, body: w.body,
    status: m.done ? "checked" : "submitted",
    marks: cleanMarks(m.marks, w.body.length),
    teacher_band: band(m.teacher_band),
    criteria: m.criteria
      ? { ta: band(m.criteria.ta), cc: band(m.criteria.cc), lr: band(m.criteria.lr), gra: band(m.criteria.gra) }
      : null,
    teacher_note: m.teacher_note.slice(0, 4000) || null,
    checked_at: m.done ? new Date().toISOString() : null,
  };
  await rest(`attempts?id=eq.${id}&${IS_WRITING}`, { method: "PATCH", body: JSON.stringify({ answers }) });
}
