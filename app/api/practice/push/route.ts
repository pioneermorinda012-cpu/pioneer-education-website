import { NextRequest, NextResponse } from "next/server";
import { readSession, COOKIE } from "@/lib/session";
import { cleanSub, pushReady, removeSub, saveSub } from "@/lib/push";

export const runtime = "nodejs";

/* A student turned practice reminders on (or off) in this browser
 * (components/practice/PushOptIn.tsx). On: keep the browser's subscription
 * with their account. Off: forget it. */
export async function POST(req: NextRequest) {
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const s = secret ? await readSession(req.cookies.get(COOKIE)?.value, secret) : null;
  if (!s || s.role !== "student") return NextResponse.json({ ok: false, reason: "not a student" }, { status: 401 });
  if (!pushReady()) return NextResponse.json({ ok: false, reason: "reminders are not set up" }, { status: 503 });

  let b: { subscription?: unknown; off?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const sub = cleanSub(b.subscription);
  if (!sub) return NextResponse.json({ error: "Bad subscription." }, { status: 400 });

  try {
    if (b.off) await removeSub(sub.endpoint);
    else await saveSub(s.sid, sub, req.headers.get("user-agent") ?? "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("push subscribe", e);
    return NextResponse.json({ ok: false, reason: "could not reach the database" }, { status: 502 });
  }
}
