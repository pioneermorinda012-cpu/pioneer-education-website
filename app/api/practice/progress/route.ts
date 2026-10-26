import { NextRequest, NextResponse } from "next/server";
import { readSession, COOKIE } from "@/lib/session";
import { cleanData, getProgress, MAX_BYTES, progressReady, putProgress } from "@/lib/progress";
import { TRAINERS } from "@/lib/trainer-page";

export const runtime = "nodejs";

/* A trainer page saved its progress (lib/trainer-page.ts sends it here).
 * Kept with the student's account so it comes back on any phone or browser.
 * Only for a signed-in student, and only for a trainer we serve. */
export async function POST(req: NextRequest) {
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const s = secret ? await readSession(req.cookies.get(COOKIE)?.value, secret) : null;
  if (!s || s.role !== "student") return NextResponse.json({ saved: false, reason: "not a student" }, { status: 401 });
  if (!progressReady()) return NextResponse.json({ saved: false, reason: "database not set up" }, { status: 503 });

  const text = await req.text();
  if (text.length > MAX_BYTES) return NextResponse.json({ saved: false, reason: "too large" }, { status: 413 });
  let b: { trainer?: unknown; at?: unknown; data?: unknown };
  try { b = JSON.parse(text); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const trainer = typeof b.trainer === "string" ? b.trainer : "";
  if (!TRAINERS.has(trainer)) return NextResponse.json({ error: "Unknown trainer." }, { status: 400 });
  const data = cleanData(b.data);
  if (!data) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const now = Date.now();
  // the browser's clock decides the order of saves, but never a time in the future
  const at = typeof b.at === "number" && Number.isFinite(b.at) ? Math.min(b.at, now) : now;

  try {
    // an old tab left open must not overwrite newer progress made elsewhere
    const cur = await getProgress(s.sid, trainer);
    if (cur && cur.at > at) return NextResponse.json({ saved: false, reason: "newer copy kept" });
    await putProgress(s.sid, trainer, { at, data });
    return NextResponse.json({ saved: true });
  } catch (e) {
    console.error("save progress", trainer, e);
    return NextResponse.json({ saved: false, reason: "could not reach the database" }, { status: 502 });
  }
}
