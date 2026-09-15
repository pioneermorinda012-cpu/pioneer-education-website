import { NextRequest, NextResponse } from "next/server";
import { findStudentForLogin, supabaseReady } from "@/lib/students";
import { verifyPin, signSession, COOKIE, SESSION_HOURS, type Session } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.PRACTICE_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Sign-in is not configured yet. PRACTICE_SESSION_SECRET is missing." },
      { status: 503 },
    );
  }
  if (!supabaseReady()) {
    return NextResponse.json(
      { error: "Sign-in is not configured yet. The database settings are missing." },
      { status: 503 },
    );
  }

  let code = "", pin = "";
  try {
    const body = await req.json();
    code = String(body.code ?? "");
    pin = String(body.pin ?? "");
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (!code.trim() || !pin.trim()) {
    return NextResponse.json({ error: "Enter your student code and PIN." }, { status: 400 });
  }

  let student;
  try {
    student = await findStudentForLogin(code);
  } catch {
    return NextResponse.json({ error: "Could not reach the database. Try again." }, { status: 502 });
  }

  // Same message whether the code is unknown or the PIN is wrong, so nobody can
  // use the error to work out which student codes exist.
  const bad = NextResponse.json({ error: "That code and PIN do not match." }, { status: 401 });
  if (!student) return bad;
  if (!(await verifyPin(pin, student.pin_hash))) return bad;

  const session: Session = {
    sid: student.id,
    code: student.code,
    name: student.full_name,
    batch: student.batch ?? undefined,
    role: "student",
    exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };
  const res = NextResponse.json({ ok: true, name: student.full_name });
  res.cookies.set(COOKIE, await signSession(session, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
  return res;
}
