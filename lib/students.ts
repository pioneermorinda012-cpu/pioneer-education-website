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
  /* Filled in for students who enrolled by paying online. */
  email?: string | null;
  phone?: string | null;
  payment_id?: string | null;
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
  /* A save that asks for no reply ("return=minimal") gets an empty 201 back;
     reading that as JSON would throw after the save had already worked. */
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** The row plus its PIN hash. Only the login route should call this. */
export async function findStudentForLogin(code: string):
  Promise<(Student & { pin_hash: string }) | null> {
  // A student who enrolled online may sign in with their email instead of the code.
  if (code.includes("@")) return findStudentByEmail(code);
  const q = encodeURIComponent(code.trim().toUpperCase());
  const rows = await rest(`students?code=eq.${q}&active=is.true&limit=1`);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

/** Emails are stored in lower case, so this is an exact match. */
export async function findStudentByEmail(email: string):
  Promise<(Student & { pin_hash: string }) | null> {
  const q = encodeURIComponent(email.trim().toLowerCase());
  const rows = await rest(`students?email=eq.${q}&active=is.true&order=created_at.desc&limit=1`);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

export async function findStudentById(id: string):
  Promise<(Student & { pin_hash: string }) | null> {
  const rows = await rest(`students?id=eq.${encodeURIComponent(id)}&limit=1`);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

/** Razorpay sends the same payment more than once; this is how a repeat is spotted. */
export async function findStudentByPayment(paymentId: string): Promise<Student | null> {
  const rows = await rest(`students?payment_id=eq.${encodeURIComponent(paymentId)}&limit=1`);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

export async function listStudents(): Promise<Student[]> {
  const cols = "id,code,full_name,batch,track,active,created_at";
  // email and phone exist once supabase/2026-10-online-payments.sql has run;
  // without them the list still loads, just without those two
  let rows;
  try {
    rows = await rest(`students?select=${cols},email,phone&order=created_at.desc&limit=500`);
  } catch {
    rows = await rest(`students?select=${cols}&order=created_at.desc&limit=500`);
  }
  return Array.isArray(rows) ? rows : [];
}

export async function createStudent(s: {
  code: string; pin_hash: string; full_name: string; batch?: string; track?: "academic" | "gt";
  email?: string; phone?: string; payment_id?: string;
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
      // only sent when present, so the teacher page keeps working before the
      // payments columns have been added to the database
      ...(s.email ? { email: s.email.trim().toLowerCase() } : {}),
      ...(s.phone ? { phone: s.phone.trim() } : {}),
      ...(s.payment_id ? { payment_id: s.payment_id } : {}),
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
