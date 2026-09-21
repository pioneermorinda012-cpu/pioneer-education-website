/* SERVER ONLY. Saved attempts — what a student did, and how they did.
 * Never import this from a file marked "use client". */

import type { MarkResult } from "@/lib/marking";

export type Attempt = {
  id: string;
  student_id: string;
  test_id: string;
  skill: string;
  raw_score: number;
  total: number;
  band: number;
  answers: Record<string, unknown>;
  per_question: { n: string; correct: boolean; given: string; expected: string; type?: string }[];
  seconds_used: number | null;
  submitted_at: string;
};

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function attemptsReady(): boolean {
  return Boolean(BASE && KEY);
}

async function rest(path: string, init: RequestInit = {}) {
  if (!attemptsReady()) throw new Error("Supabase is not configured");
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.status === 204 ? null : res.json();
}

export async function saveAttempt(a: {
  student_id: string; test_id: string; skill: string;
  result: MarkResult; answers: Record<string, unknown>; seconds_used?: number;
}): Promise<void> {
  await rest("attempts", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      student_id: a.student_id,
      test_id: a.test_id,
      skill: a.skill,
      raw_score: a.result.raw,
      total: a.result.total,
      band: a.result.band,
      answers: a.answers,
      per_question: a.result.questions,
      seconds_used: a.seconds_used ?? null,
    }),
  });
}

export async function attemptsForStudent(studentId: string, limit = 200): Promise<Attempt[]> {
  const rows = await rest(
    `attempts?student_id=eq.${encodeURIComponent(studentId)}` +
    `&order=submitted_at.desc&limit=${limit}`,
  );
  return Array.isArray(rows) ? rows : [];
}

/**
 * The top ten on one test — each student's best attempt, once.
 *
 * Only a first name and an initial leave this function. A board that names
 * everyone in full is a class ranking on a public wall, and a student who has a
 * bad week should not have to explain it to the rest of the batch.
 */
export type BoardRow = {
  name: string; raw: number; total: number; band: number; seconds: number | null; me?: boolean;
};

const shortName = (full: string): string => {
  const parts = String(full).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "A student";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[1][0].toUpperCase()}.`;
};

export async function leaderboard(testId: string, meId?: string, top = 10): Promise<BoardRow[]> {
  const rows = await rest(
    "attempts?select=student_id,raw_score,total,band,seconds_used,students(full_name)" +
    `&test_id=eq.${encodeURIComponent(testId)}` +
    "&order=raw_score.desc,seconds_used.asc&limit=500",
  );
  if (!Array.isArray(rows)) return [];

  // Already sorted best first, so the first row seen for a student is their best.
  const best = new Map<string, BoardRow>();
  for (const r of rows as {
    student_id: string; raw_score: number; total: number; band: number;
    seconds_used: number | null; students?: { full_name?: string } | null;
  }[]) {
    if (best.has(r.student_id)) continue;
    best.set(r.student_id, {
      name: shortName(r.students?.full_name ?? ""),
      raw: r.raw_score,
      total: r.total,
      band: Number(r.band),
      seconds: r.seconds_used,
      ...(meId && r.student_id === meId ? { me: true } : {}),
    });
  }
  return [...best.values()].slice(0, top);
}

/** One attempt in full, for reopening a review later. */
export async function attemptById(id: string): Promise<Attempt | null> {
  if (!/^[0-9a-f-]{10,40}$/i.test(id)) return null;
  const rows = await rest(`attempts?id=eq.${encodeURIComponent(id)}&limit=1`);
  return Array.isArray(rows) && rows[0] ? (rows[0] as Attempt) : null;
}

/** Light rows for the teacher's list — no answer blobs. */
export async function recentAttempts(limit = 300) {
  const rows = await rest(
    "attempts?select=id,student_id,test_id,skill,raw_score,total,band,submitted_at" +
    `&order=submitted_at.desc&limit=${limit}`,
  );
  return Array.isArray(rows) ? rows : [];
}
