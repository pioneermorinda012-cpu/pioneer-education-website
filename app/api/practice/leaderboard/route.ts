import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession, COOKIE, TEACHER_COOKIE } from "@/lib/session";
import { leaderboard, attemptsReady } from "@/lib/attempts";

/** Top ten on one test. Signed-in students only, and names are shortened
 *  before they leave the server — see lib/attempts. */
export async function GET(req: NextRequest) {
  const testId = req.nextUrl.searchParams.get("testId") ?? "";
  if (!/^[a-z0-9-]+$/.test(testId)) {
    return NextResponse.json({ error: "Bad test id." }, { status: 400 });
  }

  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const store = await cookies();
  const session = secret ? await readSession(store.get(COOKIE)?.value, secret) : null;
  const teacher = secret ? await readSession(store.get(TEACHER_COOKIE)?.value, secret) : null;
  if (!session && !teacher) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  if (!attemptsReady()) return NextResponse.json({ rows: [] });

  try {
    return NextResponse.json({ rows: await leaderboard(testId, session?.sid) });
  } catch (e) {
    console.error("leaderboard failed:", (e as Error).message);
    return NextResponse.json({ rows: [] });
  }
}
