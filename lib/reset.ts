/* SERVER ONLY. The link in a "Forgot password" email.
 *
 * The token names the student and an expiry, signed with the session secret.
 * It also carries the tail of the student's current password hash: once the
 * password has been changed that no longer matches, so each link works once. */
import { createHmac, timingSafeEqual } from "node:crypto";

const HOURS = 1;
const b64 = (s: string) => Buffer.from(s).toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString();
const mac = (body: string, secret: string) =>
  createHmac("sha256", secret + "|password-reset").update(body).digest("base64url");
const fingerprint = (pinHash: string) => pinHash.slice(-12);

export function makeResetToken(sid: string, pinHash: string, secret: string): string {
  const body = b64(JSON.stringify({ sid, exp: Date.now() + HOURS * 3600_000, f: fingerprint(pinHash) }));
  return `${body}.${mac(body, secret)}`;
}

/** The student id, or null if the link is forged, expired or already used. */
export function readResetToken(token: string, secret: string): { sid: string; f: string } | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const a = Buffer.from(token.slice(dot + 1)), b = Buffer.from(mac(body, secret));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(unb64(body));
    if (typeof p.sid !== "string" || typeof p.exp !== "number" || p.exp < Date.now()) return null;
    return { sid: p.sid, f: String(p.f) };
  } catch { return null; }
}

export const stillUnused = (f: string, pinHash: string) => f === fingerprint(pinHash);
export const RESET_HOURS = HOURS;
