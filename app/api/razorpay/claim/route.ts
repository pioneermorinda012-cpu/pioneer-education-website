import { NextRequest, NextResponse } from "next/server";
import { findStudentByPayment, setStudentPin, supabaseReady } from "@/lib/students";
import { signSession, hashPin, COOKIE, SESSION_HOURS, type Session } from "@/lib/session";
import { getAccess, homeFor } from "@/lib/access";
import { verifyPaymentLinkSignature } from "@/lib/link-signature";

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

  try {
    await setStudentPin(student.id, await hashPin(password));

    let access: Session["access"];
    try { access = await getAccess(student.id); } catch { access = undefined; }

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
