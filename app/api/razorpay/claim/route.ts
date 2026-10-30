import { NextRequest, NextResponse } from "next/server";
import { findStudentByPayment, setStudentPin, supabaseReady } from "@/lib/students";
import { signSession, hashPin, COOKIE, SESSION_HOURS, type Session } from "@/lib/session";
import { activeAreas, getAccessRow, homeFor } from "@/lib/access";
import { verifyPaymentLinkSignature } from "@/lib/link-signature";
import { hit, visitor } from "@/lib/ratelimit";

export const runtime = "nodejs";

/* Lets a student choose their own password right on the Thank You page,
 * instead of waiting for the emailed one — but only once the account the
 * webhook creates (app/api/razorpay/webhook) actually exists, and only when
 * the redirect parameters are genuinely signed by Razorpay.
 *
 * Returns 202 (not an error) while the account has not been created yet:
 * the webhook is a separate, asynchronous call from Razorpay's servers and
 * can land a second or two after the browser's own redirect. The page
 * retries a few times on that response rather than giving up. */

export async function POST(req: NextRequest) {
  const secret = process.env.PRACTICE_SESSION_SECRET;
  if (!secret || !supabaseReady() || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "This is not set up yet." }, { status: 503 });
  }

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  if (!(await hit("claim:" + visitor(req), 3600, 20)).allowed) {
    return NextResponse.json({ error: "Too many tries from this device. Please WhatsApp us at +91 73802 61308." }, { status: 429 });
  }
  const paymentId = String(b.paymentId ?? "");
  const linkId = String(b.linkId ?? "");
  const referenceId = String(b.referenceId ?? "");
  const status = String(b.status ?? "");
  const signature = String(b.signature ?? "");
  const password = String(b.password ?? "");

  if (!paymentId || !linkId || !signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Use at least 6 characters." }, { status: 400 });
  }
  if (status !== "paid") {
    return NextResponse.json({ error: "This payment was not completed." }, { status: 400 });
  }
  if (!verifyPaymentLinkSignature({ paymentLinkId: linkId, referenceId, status, paymentId, signature })) {
    return NextResponse.json({ error: "Could not verify this payment." }, { status: 401 });
  }

  let student;
  try {
    student = await findStudentByPayment(paymentId);
  } catch {
    return NextResponse.json({ error: "Could not reach the database. Try again." }, { status: 502 });
  }
  if (!student) {
    // Signature is genuine, but the webhook has not created the login yet.
    return NextResponse.json({ ok: false, pending: true }, { status: 202 });
  }

  // The webhook saves which modules were paid for straight after making the
  // login. Until that is in, say "not yet" rather than sign the student in
  // with no settings — which would open everything.
  let row;
  try { row = await getAccessRow(student.id); } catch { row = undefined; }
  if (!row || !row.payments.includes(paymentId)) {
    return NextResponse.json({ ok: false, pending: true }, { status: 202 });
  }

  try {
    await setStudentPin(student.id, await hashPin(password));

    const access: Session["access"] = activeAreas(row);

    const session: Session = {
      sid: student.id, code: student.code, name: student.full_name,
      batch: student.batch ?? undefined, role: "student",
      ...(access ? { access } : {}),
      exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
    };
    const res = NextResponse.json({
      ok: true, code: student.code, home: homeFor({ role: "student", access }),
    });
    res.cookies.set(COOKIE, await signSession(session, secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_HOURS * 60 * 60,
    });
    return res;
  } catch (e) {
    console.error("razorpay claim", e);
    return NextResponse.json({ error: "Could not save your password. Try again." }, { status: 500 });
  }
}
