import { NextRequest, NextResponse } from "next/server";
import { findStudentById, setStudentPin, supabaseReady } from "@/lib/students";
import { readResetToken, stillUnused } from "@/lib/reset";
import { hashPin } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.PRACTICE_SESSION_SECRET;
  if (!secret || !supabaseReady()) {
    return NextResponse.json({ error: "Password reset is not set up yet." }, { status: 503 });
  }
  let token = "", password = "";
  try {
    const b = await req.json();
    token = String(b.token ?? ""); password = String(b.password ?? "");
  } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  if (password.length < 6) {
    return NextResponse.json({ error: "Use at least 6 characters." }, { status: 400 });
  }
  const t = readResetToken(token, secret);
  const used = NextResponse.json(
    { error: "This link has expired or was already used. Ask for a new one." }, { status: 400 },
  );
  if (!t) return used;
  try {
    const s = await findStudentById(t.sid);
    if (!s || !s.active || !stillUnused(t.f, s.pin_hash)) return used;
    await setStudentPin(s.id, await hashPin(password));
    return NextResponse.json({ ok: true, code: s.code });
  } catch (e) {
    console.error("reset", e);
    return NextResponse.json({ error: "Could not reach the database. Try again." }, { status: 502 });
  }
}
