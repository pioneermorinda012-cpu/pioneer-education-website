/* SERVER ONLY. Counting attempts, so that guessing and spamming stop working.
 *
 * Used for: wrong student passwords (a 4-digit PIN has only 10,000
 * possibilities), wrong teacher codes, "forgot password" emails, enquiry
 * forms, and the AI chatbot and tutor (each AI reply costs money).
 *
 * The site runs on many short-lived servers at once, so a count kept in one
 * server's memory would not stop anyone. The counts are kept in the database
 * instead, in the existing `explanations` table (key/value: test_id = the
 * counter's name, starting "rl:", q = 0, body = the count as JSON), so nothing
 * has to be set up. Real explanations never start with "rl:".
 *
 * If the database cannot be reached the request is allowed: a student must
 * never be locked out because of a database hiccup.
 */
import crypto from "node:crypto";
import type { NextRequest } from "next/server";

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

type Count = { n: number; start: number; flagged?: boolean };

const id = (name: string) => "rl:" + name.slice(0, 180);

async function read(name: string): Promise<Count | null> {
  const rows = (await rest(`explanations?select=body&test_id=eq.${encodeURIComponent(id(name))}&q=eq.0&limit=1`)) as
    { body: string }[] | null;
  try { return rows?.[0] ? (JSON.parse(rows[0].body) as Count) : null; } catch { return null; }
}

async function write(name: string, c: Count): Promise<void> {
  await rest("explanations?on_conflict=test_id,q", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ test_id: id(name), q: 0, body: JSON.stringify(c) }),
  });
}

/** The visitor's address, scrambled — never stored as it is. */
export function visitor(req: NextRequest): string {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return crypto.createHash("sha256").update((process.env.PRACTICE_SESSION_SECRET ?? "") + ip).digest("hex").slice(0, 24);
}

export type Verdict = { allowed: boolean; count: number; retryAfterSec: number; first: boolean };

/** How many times `name` has been counted in the current window, without counting. */
export async function peek(name: string, windowSec: number, limit: number): Promise<Verdict> {
  if (!BASE || !KEY) return { allowed: true, count: 0, retryAfterSec: 0, first: false };
  try {
    const c = await read(name);
    const now = Date.now();
    if (!c || now - c.start > windowSec * 1000) return { allowed: true, count: 0, retryAfterSec: 0, first: false };
    const retry = Math.ceil((c.start + windowSec * 1000 - now) / 1000);
    return { allowed: c.n < limit, count: c.n, retryAfterSec: c.n < limit ? 0 : retry, first: false };
  } catch (e) {
    console.error("ratelimit peek", e);
    return { allowed: true, count: 0, retryAfterSec: 0, first: false };
  }
}

/**
 * Count one more. `allowed` is false once the count goes over `limit` within
 * `windowSec`. `first` is true exactly once, on the attempt that first goes
 * over — the moment to send an alert, so an attack makes one email, not a
 * thousand.
 */
export async function hit(name: string, windowSec: number, limit: number): Promise<Verdict> {
  if (!BASE || !KEY) return { allowed: true, count: 0, retryAfterSec: 0, first: false };
  try {
    const now = Date.now();
    let c = await read(name);
    if (!c || now - c.start > windowSec * 1000) c = { n: 0, start: now };
    c.n += 1;
    const over = c.n > limit;
    const first = over && !c.flagged;
    if (over) c.flagged = true;
    await write(name, c);
    const retry = Math.ceil((c.start + windowSec * 1000 - now) / 1000);
    return { allowed: !over, count: c.n, retryAfterSec: over ? retry : 0, first };
  } catch (e) {
    console.error("ratelimit hit", e);
    return { allowed: true, count: 0, retryAfterSec: 0, first: false };
  }
}

/** Forget a count (after a correct password). */
export async function clear(name: string): Promise<void> {
  if (!BASE || !KEY) return;
  try { await rest(`explanations?test_id=eq.${encodeURIComponent(id(name))}&q=eq.0`, { method: "DELETE" }); }
  catch (e) { console.error("ratelimit clear", e); }
}

/** "15 minutes", "1 hour" — for messages. */
export function wait(sec: number): string {
  const m = Math.max(1, Math.ceil(sec / 60));
  return m >= 60 ? `${Math.round(m / 60)} hour${m >= 120 ? "s" : ""}` : `${m} minute${m === 1 ? "" : "s"}`;
}
