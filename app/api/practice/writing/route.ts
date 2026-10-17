import { NextRequest, NextResponse } from "next/server";
import { readSession, COOKIE } from "@/lib/session";
import { saveWriting, writingsReady } from "@/lib/writings";
import { getWritingTask } from "@/lib/writing";
import { countWords } from "@/lib/writing-score";

export const runtime = "nodejs";

/* A student pressed "I have finished": keep the writing in their account so
 * they and the teacher can open it later. A teacher trying a task out is not
 * a student, so nothing is saved for them. */
export async function POST(req: NextRequest) {
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const s = secret ? await readSession(req.cookies.get(COOKIE)?.value, secret) : null;
  if (!s || s.role !== "student") return NextResponse.json({ saved: false, reason: "not a student" });
  if (!writingsReady()) return NextResponse.json({ saved: false, reason: "database not set up" });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const task = await getWritingTask(String(b.task_id ?? ""));
  if (!task) return NextResponse.json({ error: "Unknown task." }, { status: 400 });
  const body = String(b.body ?? "").replace(/\r\n?/g, "\n").slice(0, 20000);
  if (!body.trim()) return NextResponse.json({ error: "Nothing written." }, { status: 400 });

  // the question is taken from the task on the server, never from the browser
  const q = Number(b.chosen ?? 0);
  const question = (task.prompts?.[Number.isInteger(q) ? q : 0] ?? task.prompts?.[0] ?? task.title).slice(0, 4000);
  try {
    const id = await saveWriting({
      id: typeof b.id === "string" ? b.id : undefined,
      student_id: s.sid, task_id: task.id, kind: task.kind, question, body,
      words: countWords(body),
      seconds_used: Number.isFinite(Number(b.seconds)) ? Math.max(0, Math.round(Number(b.seconds))) : null,
      auto_band: Number.isFinite(Number(b.estimate)) ? Number(b.estimate) : null,
    });
    return NextResponse.json({ saved: true, id });
  } catch (e) {
    console.error("save writing", e);
    return NextResponse.json({ saved: false, reason: "could not reach the database" }, { status: 502 });
  }
}
