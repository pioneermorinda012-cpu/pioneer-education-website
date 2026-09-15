import { NextResponse } from "next/server";
import { COOKIE, TEACHER_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  for (const name of [COOKIE, TEACHER_COOKIE]) {
    res.cookies.set(name, "", { httpOnly: true, path: "/", maxAge: 0 });
  }
  return res;
}
