import { NextRequest, NextResponse } from "next/server";
import { readSession, COOKIE } from "@/lib/session";
import { MAX_SHARE_BYTES, saveShared, sharedReady } from "@/lib/shared-results";
import { hit, wait } from "@/lib/ratelimit";

export const runtime = "nodejs";

/* A student froze the exercise they are on and wants to send it to the
 * teacher (the button is added to every trainer by lib/trainer-page.ts).
 * Saves the page and returns the link to put in the WhatsApp message. */
export async function POST(req: NextRequest) {
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const s = secret ? await readSession(req.cookies.get(COOKIE)?.value, secret) : null;
  if (!s || s.role !== "student") return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!sharedReady()) return NextResponse.json({ error: "Sharing is not set up yet." }, { status: 503 });

  const limit = await hit(`share:${s.sid}`, 3600, 40);
  if (!limit.allowed) {
    return NextResponse.json({ error: `Too many results sent. Try again in ${wait(limit.retryAfterSec)}.` }, { status: 429 });
  }

  const text = await req.text();
  if (text.length > MAX_SHARE_BYTES) return NextResponse.json({ error: "This page is too large to send." }, { status: 413 });
  let b: { page?: unknown; title?: unknown; score?: unknown; html?: unknown };
  try { b = JSON.parse(text); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const page = typeof b.page === "string" ? b.page : "";
  const html = typeof b.html === "string" ? b.html : "";
  if (!page.startsWith("/practice/") || page.length > 300 || html.length < 50) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const title = typeof b.title === "string" ? b.title.slice(0, 200) : "";
  const score = typeof b.score === "string" ? b.score.slice(0, 80) : "";

  try {
    const id = await saveShared({ student_id: s.sid, page, title, score, name: s.name, code: s.code, html });
    const url = `${new URL(req.url).origin}/practice/shared/${id}`;
    return NextResponse.json({ id, url, name: s.name, code: s.code });
  } catch (e) {
    console.error("save shared result", e);
    return NextResponse.json({ error: "Could not save. Please try again." }, { status: 502 });
  }
}
