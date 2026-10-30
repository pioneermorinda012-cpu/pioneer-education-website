/* SERVER ONLY. Cloudflare Turnstile — the free "I am human" check on public
 * forms (components/Turnstile.tsx shows it). Most visitors never see a puzzle:
 * Cloudflare decides in the background, and only asks a suspicious visitor to
 * tick a box.
 *
 * Off until both keys are set in Vercel: NEXT_PUBLIC_TURNSTILE_SITE_KEY (the
 * widget) and TURNSTILE_SECRET_KEY (this check). With no secret every form
 * works exactly as before. If Cloudflare itself cannot be reached the form is
 * let through rather than losing a real enquiry; the attempt limits still apply.
 */
import type { NextRequest } from "next/server";

/* Both keys, or neither: with only the secret set, the forms would demand a
 * check the page never shows, and every real enquiry would be refused. */
export const turnstileOn = () => Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export async function turnstileOk(token: string, req: NextRequest): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !turnstileOn()) return true;
  if (!token || token.length > 2048) return false;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
      cache: "no-store",
    });
    const d = (await res.json()) as { success?: boolean };
    return d.success === true;
  } catch (e) {
    console.error("turnstile unreachable", e);
    return true;
  }
}
