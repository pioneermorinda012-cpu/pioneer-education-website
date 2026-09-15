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
  per_question: { n: string; correct: boolean; given: string; expected: string }[];
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

/** Light rows for the teacher's list — no answer blobs. */
export async function recentAttempts(limit = 300) {
  const rows = await rest(
    "attempts?select=id,student_id,test_id,skill,raw_score,total,band,submitted_at" +
    `&order=submitted_at.desc&limit=${limit}`,
  );
  return Array.isArray(rows) ? rows : [];
}
