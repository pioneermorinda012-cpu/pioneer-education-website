import { NextRequest, NextResponse } from "next/server";
import { readSession, COOKIE, TEACHER_COOKIE } from "@/lib/session";
import { allows } from "@/lib/access";
import { hit } from "@/lib/ratelimit";

/**
 * The AI tutor inside the French trainer (content/french/*.html): writing
 * feedback, checking spoken answers, the shop role-plays and "Ask the tutor".
 *
 * The page builds the prompt; this route only lets a signed-in student of the
 * French course through, keeps the request small, pins the tutor's role in the
 * system prompt so it cannot be used as a general chatbot, and returns the
 * text. The API key never leaves the server.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.TUTOR_MODEL ?? "claude-sonnet-4-6";
const MAX_CHARS = 24_000;

const SYSTEM = `You are the AI French tutor inside Pioneer Education's French course (Prem Nagar, Morinda, Punjab).
The students are beginners working towards the DELF A1 exam. Their other languages are Punjabi, Hindi and English.
- Only help with learning French: explanations, corrections, feedback on the student's French, and the role-plays the course sets up.
  If asked for anything else, say in one sentence that you can only help with French, and steer back to the lesson.
- Your French must be correct, with all accents. Keep French examples at A1 level.
- Explain in simple English unless the course asks you to speak French (role-plays).
- When the request asks for JSON, reply with only that JSON and nothing else.`;

type Turn = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const student = secret ? await readSession(req.cookies.get(COOKIE)?.value, secret) : null;
  const teacher = secret ? await readSession(req.cookies.get(TEACHER_COOKIE)?.value, secret) : null;
  const who = student ?? (teacher && teacher.role === "teacher" ? teacher : null);
  if (!who) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!allows(who, ["french"])) return NextResponse.json({ error: "The tutor is part of the French course." }, { status: 403 });

  const key = process.env.ANTHROPIC_API_KEY ?? "";
  if (!key) return NextResponse.json({ error: "The AI tutor is not switched on yet." }, { status: 503 });

  // Each reply costs money: 15 a minute and 200 a day per student is far more
  // than real study needs, and stops a shared or stolen login being used up.
  if (who.role === "student") {
    const day = new Date().toISOString().slice(0, 10);
    const [m, d] = await Promise.all([
      hit("tutor-m:" + who.sid, 60, 15),
      hit("tutor-d:" + who.sid + ":" + day, 86400, 200),
    ]);
    if (!m.allowed) return NextResponse.json({ error: "Slow down a little — wait a minute and try again." }, { status: 429 });
    if (!d.allowed) return NextResponse.json({ error: "You have used today's AI tutor limit. It resets tomorrow." }, { status: 429 });
  }

  let body: { messages?: unknown; json?: unknown; quick?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  // Plain user/assistant turns only, merged where two of the same role meet,
  // starting and ending with the student.
  const raw = Array.isArray(body.messages) ? body.messages.slice(-30) : [];
  const turns: Turn[] = [];
  let chars = 0;
  for (const m of raw) {
    const role = (m as Turn)?.role, content = (m as Turn)?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) continue;
    chars += content.length;
    const last = turns[turns.length - 1];
    if (last && last.role === role) last.content += "\n\n" + content;
    else turns.push({ role, content });
  }
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") return NextResponse.json({ error: "Bad request." }, { status: 400 });
  if (chars > MAX_CHARS) return NextResponse.json({ error: "That is too long. Please send less at a time." }, { status: 413 });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: body.json ? 1500 : body.quick ? 300 : 700,
        system: SYSTEM,
        messages: turns,
      }),
    });
    const data = await res.json();
    if (res.status === 429) return NextResponse.json({ error: "The tutor is busy. Try again in a minute." }, { status: 429 });
    if (!res.ok) throw new Error(data?.error?.message ?? `API ${res.status}`);
    const text = Array.isArray(data.content)
      ? data.content.filter((c: { type?: string }) => c.type === "text").map((c: { text: string }) => c.text).join("")
      : "";
    if (!text.trim()) throw new Error("empty reply");
    return NextResponse.json({ text });
  } catch (e) {
    console.error("french tutor", e);
    return NextResponse.json({ error: "The tutor could not answer. Please try again." }, { status: 502 });
  }
}
