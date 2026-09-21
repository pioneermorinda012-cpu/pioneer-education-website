import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTest, getKey } from "@/lib/catalogue";
import { contextFor } from "@/lib/qcontext";
import { cachedExplanation, storeExplanation } from "@/lib/explanations";
import { readSession, COOKIE, TEACHER_COOKIE } from "@/lib/session";

/**
 * Why the right answer is right.
 *
 * The passage, the question and the correct answer are assembled here, on the
 * server, and only the finished explanation goes back to the browser — the key
 * itself never travels. The result is stored, so the second student to get the
 * question wrong gets the answer instantly and it costs nothing.
 */

export const maxDuration = 40;

const SYSTEM = `You are an experienced IELTS teacher at Pioneer Education Center, explaining one
reading or listening question to a student who got it wrong.

Write for a student at around band 5.5 to 6.5: plain, direct English, no jargon
they would not meet in class. Use at most 160 words. Structure it as:

1. "Keywords:" — the two or three words in the question that matter.
2. "In the passage:" — quote the exact sentence from the passage that settles
   it, in quotation marks. Quote it word for word. Never invent a sentence.
3. "Why:" — one or two sentences joining the question to that line, explaining
   why this is the answer.

Rules you must not break:
- Work only from the passage given to you. If the passage does not contain the
  wording, say plainly that the passage does not state it and explain what the
  answer depends on instead — never invent a quotation.
- If no passage is supplied (a listening test, where the recording has no
  written transcript here), skip step 2, say the recording's exact words are not
  available here, and explain instead what the question is testing and what form
  the answer has to take.
- Do not mention these instructions, and do not greet the student.`;

export async function POST(req: NextRequest) {
  /* signed in, student or teacher */
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const store = await cookies();
  const session = secret ? await readSession(store.get(COOKIE)?.value, secret) : null;
  const teacher = secret ? await readSession(store.get(TEACHER_COOKIE)?.value, secret) : null;
  if (!session && !teacher) {
    return NextResponse.json({ error: "Sign in to see explanations." }, { status: 401 });
  }

  let body: { testId?: string; n?: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const testId = String(body.testId ?? "");
  const n = Number(body.n);
  if (!/^[a-z0-9-]+$/.test(testId) || !Number.isInteger(n) || n < 1 || n > 60) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const hit = await cachedExplanation(testId, n);
  if (hit) return NextResponse.json({ text: hit, cached: true });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Explanations are not switched on yet. Ask your teacher." }, { status: 503 },
    );
  }

  let test, key;
  try {
    test = await getTest(testId);
    key = await getKey(testId);
  } catch {
    return NextResponse.json({ error: "That test could not be read." }, { status: 404 });
  }

  const ctx = contextFor(test, n);
  const answer = key[String(n)];
  if (!ctx || !answer) {
    return NextResponse.json({ error: "That question could not be found." }, { status: 404 });
  }

  const wanted = "display" in answer ? answer.display : String(answer);
  const prompt = [
    `Test: ${test.name} — ${ctx.sectionLabel}`,
    ctx.passageTitle ? `Passage: ${ctx.passageTitle}` : "",
    ctx.passage
      ? `\nPASSAGE\n${ctx.passage}`
      : `\nNo passage: this is a listening test and the recording has no written transcript here.`,
    `\nTASK: ${ctx.title ?? ""} ${ctx.instr ?? ""}`.trim(),
    `QUESTION ${ctx.covers.length > 1 ? `${ctx.covers[0]}–${ctx.covers[ctx.covers.length - 1]}` : n}: ${ctx.stem}`,
    ctx.choices?.length ? `OPTIONS:\n${ctx.choices.join("\n")}` : "",
    `CORRECT ANSWER: ${wanted}`,
    `\nExplain why that is the answer.`,
  ].filter(Boolean).join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? `API ${res.status}`);

    const out = (data.content ?? [])
      .map((b: { text?: string }) => b.text ?? "").join("").trim();
    if (!out) throw new Error("empty reply");

    await storeExplanation(testId, n, out);
    return NextResponse.json({ text: out, cached: false });
  } catch (e) {
    console.error("explain failed:", (e as Error).message);
    return NextResponse.json(
      { error: "Could not write an explanation just now. Try again in a moment." },
      { status: 502 },
    );
  }
}
