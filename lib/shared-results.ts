/* SERVER ONLY. A student's finished exercise, frozen and sent to the teacher.
 *
 * When a student taps "Send my result" on any trainer, the page as they see
 * it — their answers, the green and red marks, the score — is saved here and
 * they get a link to WhatsApp to the teacher. Opening the link shows that same
 * screen, frozen: no scripts run, nothing can be changed.
 *
 * Kept in the `attempts` table like progress (lib/progress.ts) and module
 * settings (lib/access.ts), so nothing has to be set up in the database:
 * skill "X-shared", test_id "shared:<page path>", and in `answers`
 * { page, title, score, name, html }. The skill has a dash, so lib/attempts.ts
 * leaves these rows out of every result, and the test_id matches no test, so
 * no leaderboard sees them.
 */

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SKILL = "X-shared";

/** Biggest page accepted. A 50-question lesson is well under 200 KB. */
export const MAX_SHARE_BYTES = 2_000_000;

export const sharedReady = () => Boolean(BASE && KEY);

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
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export type Shared = {
  id: string;
  student_id: string;
  submitted_at: string;
  page: string;
  title: string;
  score: string;
  name: string;
  code: string;
  html: string;
};

export async function saveShared(s: {
  student_id: string; page: string; title: string; score: string; name: string; code: string; html: string;
}): Promise<string> {
  const rows = (await rest("attempts?select=id", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      student_id: s.student_id,
      test_id: `shared:${s.page}`.slice(0, 300),
      skill: SKILL,
      raw_score: 0,
      total: 0,
      band: 0,
      answers: { page: s.page, title: s.title, score: s.score, name: s.name, code: s.code, html: s.html },
      per_question: [],
    }),
  })) as { id: string }[] | null;
  const id = Array.isArray(rows) && rows[0]?.id;
  if (!id) throw new Error("no id returned");
  return id;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getShared(id: string): Promise<Shared | null> {
  if (!UUID.test(id)) return null;
  const rows = (await rest(
    `attempts?select=id,student_id,submitted_at,answers,students(full_name,code)&id=eq.${id}&skill=eq.${SKILL}&limit=1`,
  )) as {
    id: string; student_id: string; submitted_at: string;
    answers: Record<string, unknown> | null; students?: { full_name?: string; code?: string } | null;
  }[] | null;
  const r = Array.isArray(rows) ? rows[0] : null;
  if (!r || !r.answers) return null;
  const a = r.answers;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id: r.id,
    student_id: r.student_id,
    submitted_at: r.submitted_at,
    page: str(a.page),
    title: str(a.title),
    score: str(a.score),
    name: r.students?.full_name || str(a.name),
    code: r.students?.code || str(a.code),
    html: str(a.html),
  };
}

export type SharedRow = {
  id: string; student_id: string; submitted_at: string;
  title: string; score: string; page: string;
  name: string; code: string; batch: string | null;
};

/** Newest sent results first, without the saved pages (they are large). */
export async function recentShared(limit = 300): Promise<SharedRow[]> {
  const rows = (await rest(
    "attempts?select=id,student_id,submitted_at,title:answers->>title,score:answers->>score,page:answers->>page," +
    `name:answers->>name,students(full_name,code,batch)&skill=eq.${SKILL}&order=submitted_at.desc&limit=${limit}`,
  )) as {
    id: string; student_id: string; submitted_at: string; title: string | null; score: string | null; page: string | null;
    name: string | null; students?: { full_name?: string; code?: string; batch?: string | null } | null;
  }[] | null;
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    id: r.id, student_id: r.student_id, submitted_at: r.submitted_at,
    title: (r.title ?? "").replace(/\s*·\s*Pioneer Education\s*$/, "") || "Exercise",
    score: r.score ?? "", page: r.page ?? "",
    name: r.students?.full_name || r.name || "Student",
    code: r.students?.code ?? "", batch: r.students?.batch ?? null,
  }));
}
