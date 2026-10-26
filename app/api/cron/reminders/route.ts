import { NextRequest, NextResponse } from "next/server";
import { activeSince, audience, pushReady, sendEach } from "@/lib/push";
import { eveningMessage, istMidnightIso, morningMessage } from "@/lib/push-messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The automatic practice reminders, run by Vercel Cron (vercel.json):
 *   ?slot=morning  about 8 am India time — word of the day, to everyone
 *   ?slot=evening  about 7 pm India time — only to students who have not
 *                  practised today (no test, writing or trainer save since
 *                  midnight)
 * Vercel sends "Authorization: Bearer <CRON_SECRET>"; anything else is refused,
 * so nobody else can make the site message the students.
 */
export async function GET(req: NextRequest) {
  const cron = process.env.CRON_SECRET ?? "";
  if (!cron || req.headers.get("authorization") !== `Bearer ${cron}`) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }
  if (!pushReady()) return NextResponse.json({ ok: false, reason: "reminders are not set up" });

  const slot = req.nextUrl.searchParams.get("slot") === "evening" ? "evening" : "morning";
  try {
    const { subs, people } = await audience();
    const done = slot === "evening" ? await activeSince(istMidnightIso()) : new Set<string>();
    const result = await sendEach(subs, (id) => {
      const p = people.get(id);
      if (!p || done.has(id)) return null;
      return slot === "morning" ? morningMessage(p.name, p.home) : eveningMessage(p.name, p.home);
    });
    console.log("reminders", slot, result);
    return NextResponse.json({ ok: true, slot, ...result, skippedPractised: done.size });
  } catch (e) {
    console.error("reminders", slot, e);
    return NextResponse.json({ ok: false, error: String((e as Error).message).slice(0, 200) }, { status: 500 });
  }
}
