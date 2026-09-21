/* SERVER ONLY. Explanations are written once and then remembered.
 *
 * The same question is got wrong by different students all year, and the
 * reasoning does not change. Writing it once and storing it keeps the wait to a
 * single student, and keeps the bill to one call per question rather than one
 * per student.
 */

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ready = () => Boolean(BASE && KEY);

async function rest(path: string, init: RequestInit = {}) {
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
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.status === 204 ? null : res.json();
}

export async function cachedExplanation(testId: string, n: number): Promise<string | null> {
  if (!ready()) return null;
  try {
    const rows = await rest(
      `explanations?select=body&test_id=eq.${encodeURIComponent(testId)}&q=eq.${n}&limit=1`,
    );
    return Array.isArray(rows) && rows[0]?.body ? String(rows[0].body) : null;
  } catch {
    // A cache that is down must not stop a student getting an answer.
    return null;
  }
}

export async function storeExplanation(testId: string, n: number, body: string): Promise<void> {
  if (!ready()) return;
  try {
    await rest("explanations?on_conflict=test_id,q", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ test_id: testId, q: n, body }),
    });
  } catch (e) {
    console.error("could not cache explanation:", (e as Error).message);
  }
}
