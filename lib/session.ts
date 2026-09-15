/* Sessions and PIN hashing.
 *
 * Deliberately built on the Web Crypto API only — no npm packages. That keeps
 * the dependency list short and, more importantly, lets this same file run in
 * middleware (the Edge runtime) and in ordinary route handlers without two
 * different implementations drifting apart.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

export type Session = {
  sid: string;      // student row id
  code: string;     // what they type to sign in, e.g. PEC-2431
  name: string;
  batch?: string;
  role: "student" | "teacher";
  exp: number;      // ms since epoch
};

/* ---------- base64url, without Buffer so it works in both runtimes ---------- */
function toB64url(bytes: Uint8Array<ArrayBuffer>): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
/* Backed by a plain ArrayBuffer on purpose: TypeScript 5.7 distinguishes
 * Uint8Array<ArrayBuffer> from Uint8Array<ArrayBufferLike>, and only the
 * former satisfies BufferSource in the Web Crypto signatures. */
function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* Compare without leaking how much of the string matched. */
function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ---------- the signed cookie ---------- */
async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"],
  );
}

export async function signSession(payload: Session, secret: string): Promise<string> {
  const body = toB64url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body)));
  return body + "." + toB64url(sig);
}

/** Returns null for anything not signed by us, tampered with, or expired. */
export async function readSession(token: string | undefined, secret: string): Promise<Session | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot), sig = token.slice(dot + 1);
  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromB64url(sig), enc.encode(body));
  } catch { return null; }
  if (!ok) return null;
  try {
    const payload = JSON.parse(dec.decode(fromB64url(body))) as Session;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

/* ---------- PINs ---------- */
const ITERATIONS = 150_000;

async function derive(
  pin: string, salt: Uint8Array<ArrayBuffer>, iterations: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" }, base, 256,
  );
  return new Uint8Array(bits);
}

/** Store the result of this, never the PIN itself. */
export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
  const bits = await derive(pin, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64url(salt)}$${toB64url(bits)}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1000) return false;
  try {
    const bits = await derive(pin, fromB64url(parts[2]), iterations);
    return sameString(toB64url(bits), parts[3]);
  } catch { return false; }
}

export const COOKIE = "pec_session";
export const TEACHER_COOKIE = "pec_teacher";
/** Eight hours — long enough for a full day at the centre, short enough that a
 *  shared computer does not stay signed in overnight. */
export const SESSION_HOURS = 8;
