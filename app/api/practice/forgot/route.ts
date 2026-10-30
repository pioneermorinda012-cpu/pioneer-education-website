import { NextRequest, NextResponse } from "next/server";
import { findStudentByEmail, supabaseReady } from "@/lib/students";
import { makeResetToken, RESET_HOURS } from "@/lib/reset";
import { esc, letter, mailReady, sendMail, siteUrl } from "@/lib/mail";
import { hit, visitor } from "@/lib/ratelimit";
import { turnstileOk } from "@/lib/turnstile";

export const runtime = "nodejs";

/* Always the same answer, whether or not the email belongs to a student, so
 * the form cannot be used to find out who studies here. */
const SAME = "If that email belongs to a student, a reset link is on its way. Check Spam too.";

export async function POST(req: NextRequest) {
  const secret = process.env.PRACTICE_SESSION_SECRET;
  if (!secret || !supabaseReady() || !mailReady()) {
    return NextResponse.json(
      { error: "Password reset by email is not set up yet. Ask Narinder Sir to reset it for you." },
      { status: 503 },
    );
  }
  let email = "", token = "";
  try { const b = await req.json(); email = String(b.email ?? "").trim().toLowerCase(); token = String(b.turnstile ?? ""); }
  catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  if (!(await turnstileOk(token, req))) {
    return NextResponse.json({ error: "Please complete the quick check (\"I am human\") and try again." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter the email address you paid with." }, { status: 400 });
  }

  /* At most 3 reset emails to one address and 10 from one device in an hour,
   * so the form cannot be used to flood someone's inbox. Over the limit the
   * answer looks the same, and nothing is sent. */
  const [byEmail, byDevice] = await Promise.all([
    hit("forgot:" + email, 3600, 3),
    hit("forgot-ip:" + visitor(req), 3600, 10),
  ]);
  if (!byEmail.allowed || !byDevice.allowed) return NextResponse.json({ ok: true, message: SAME });

  try {
    const s = await findStudentByEmail(email);
    if (s) {
      const link = `${siteUrl()}/practice/reset?t=${encodeURIComponent(makeResetToken(s.id, s.pin_hash, secret))}`;
      await sendMail(
        email,
        "Reset your Pioneer Education password",
        letter("Set a new password", `
<p>Dear ${esc(s.full_name)},</p>
<p>Someone asked to reset the password for student code <b>${esc(s.code)}</b>. If it was you, tap the button and choose a new one.</p>
<p><a href="${link}" style="display:inline-block;background:#DB6A0C;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">Set a new password</a></p>
<p style="font-size:14px;color:#5a6272">The link works once and only for ${RESET_HOURS} hour. If you did not ask for this, ignore this email — your password stays the same.</p>`),
        `Reset your password for student code ${s.code}: ${link} (works once, for ${RESET_HOURS} hour).`,
      );
    }
  } catch (e) {
    console.error("forgot", e);
    return NextResponse.json({ error: "Could not send the email just now. Try again in a few minutes." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, message: SAME });
}
