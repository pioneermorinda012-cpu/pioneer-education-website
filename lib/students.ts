/* SERVER ONLY. Talks to Supabase over its REST API with the secret key.
 * Never import this from a file marked "use client". */

export type Student = {
  id: string;
  code: string;
  full_name: string;
  batch: string | null;
  track: "academic" | "gt";
  active: boolean;
  created_at: string;
};

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function supabaseReady(): boolean {
  return Boolean(BASE && KEY);
}

async function rest(path: string, init: RequestInit = {}) {
  if (!supabaseReady()) throw new Error("Supabase is not configured");
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

/** The row plus its PIN hash. Only the login route should call this. */
export async function findStudentForLogin(code: string):
  Promise<(Student & { pin_hash: string }) | null> {
  const q = encodeURIComponent(code.trim().toUpperCase());
  const rows = await rest(`students?code=eq.${q}&active=is.true&limit=1`);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

export async function listStudents(): Promise<Student[]> {
  const rows = await rest(
    "students?select=id,code,full_name,batch,track,active,created_at&order=created_at.desc&limit=500",
  );
  return Array.isArray(rows) ? rows : [];
}

export async function createStudent(s: {
  code: string; pin_hash: string; full_name: string; batch?: string; track?: "academic" | "gt";
}): Promise<Student> {
  const rows = await rest("students", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      code: s.code.trim().toUpperCase(),
      pin_hash: s.pin_hash,
      full_name: s.full_name.trim(),
      batch: s.batch?.trim() || null,
      track: s.track ?? "academic",
    }),
  });
  return Array.isArray(rows) ? rows[0] : (rows as Student);
}

export async function setStudentActive(id: string, active: boolean): Promise<void> {
  await rest(`students?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export async function setStudentPin(id: string, pin_hash: string): Promise<void> {
  await rest(`students?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ pin_hash }),
  });
}
