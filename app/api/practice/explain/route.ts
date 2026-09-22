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

/**
 * Pull out the sentence the explanation quoted, but only if it really is in
 * the passage. The point of highlighting is to show the student the line that
 * settles it; highlighting a line the model invented would teach them to
 * trust something that is not there, so an unverified quote is dropped and the
 * explanation simply appears without a highlight.
 */
function verifiedQuote(text: string, passage?: string): string | null {
  if (!passage) return null;
  const norm = (s: string) =>
    s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[-–—]/g, "-").replace(/\s+/g, " ").trim();
  const hay = norm(passage);

  const candidates = [...text.matchAll(/[“"]([^“”"]{25,400})[”"]/g)]
    .map((m) => m[1].trim())
    .sort((a, b) => b.length - a.length);

  for (const c of candidates) if (hay.includes(norm(c))) return c;

  // The model sometimes tidies a sentence as it quotes it. Fall back to its
  // longest clause, which is still enough to point at the right line.
  for (const c of candidates) {
    const clauses = c.split(/[,;:]/).map((s) => s.trim())
      .filter((s) => s.split(/\s+/).length >= 5)
      .sort((a, b) => b.length - a.length);
    for (const cl of clauses) if (hay.includes(norm(cl))) return cl;
  }
  return null;
}

const SYSTEM = `You are an experienced IELTS teacher at Pioneer Education Center, explaining one
reading or listening question to a student who got it wrong.

Reply with ONE JSON object and nothing else — no preamble, no code fence:

{
  "pairs": [
    { "question": "the words in the QUESTION that matter",
      "passage":  "the words in the PASSAGE that carry the same meaning" }
  ],
  "sentence": "the whole sentence from the passage that settles the question",
  "note": "two to four sentences joining the two, ending with: For that reason, the answer is X."
}

How to fill it:
- "pairs": one to three. This is the heart of IELTS reading — the question
  paraphrases the passage, and the student has to see which words map onto
  which. Put the question's wording on the left and the passage's on the right.
- "passage" and "sentence" must be copied from the passage WORD FOR WORD,
  exactly as written, including its punctuation. Do not tidy, shorten or
  rephrase them. If you cannot find the wording, leave the field as "".
- "note": plain English for a band 5.5 to 6.5 student. No jargon they would not
  meet in class. Say how the passage line answers the question, and where a
  tempting wrong answer goes wrong if there is one.
- Never invent wording that is not in the passage. An honest "" is far better
  than a quotation the student cannot find.
- If no passage is supplied — a listening test, where the recording has no
  written transcript here — use "pairs": [], "sentence": "", and in "note" say
  the recording's exact words are not available here, then explain what the
  question is testing and what form the answer has to take.`;

type Pair = { question: string; passage: string };
type Explained = { pairs: Pair[]; sentence: string; note: string };

/** Read the model's JSON back, tolerating a stray code fence. */
function parseReply(out: string): Explained | null {
  const body = out.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const start = body.indexOf("{"), end = body.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    const o = JSON.parse(body.slice(start, end + 1));
    return {
      pairs: Array.isArray(o.pairs)
        ? o.pairs.filter((p: Pair) => p && typeof p.question === "string" && typeof p.passage === "string")
            .slice(0, 3)
        : [],
      sentence: typeof o.sentence === "string" ? o.sentence : "",
      note: typeof o.note === "string" ? o.note : "",
    };
  } catch { return null; }
}

/** Drop anything the passage does not actually contain. */
function verify(e: Explained, passage?: string): Explained {
  if (!passage) return { ...e, sentence: "", pairs: e.pairs.map((p) => ({ ...p, passage: "" })) };
  const norm = (s: string) =>
    s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[-–—]/g, "-").replace(/\s+/g, " ").trim();
  const hay = norm(passage);
  const has = (s: string) => Boolean(s) && hay.includes(norm(s));
  return {
    pairs: e.pairs.map((p) => ({ question: p.question, passage: has(p.passage) ? p.passage : "" })),
    sentence: has(e.sentence) ? e.sentence : (verifiedQuote(`"${e.sentence}"`, passage) ?? ""),
    note: e.note,
  };
}

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

  // The paper is loaded before the cache is consulted, because the passage is
  // what lets the quoted sentence be checked and then highlighted — a stored
  // explanation needs it just as much as a fresh one.
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

  const answerShown = "display" in answer ? answer.display : String(answer);

  /* Stored explanations are the JSON the model returned. One written before
   * this format existed is plain prose; it is still worth showing, so it comes
   * back under `text` and the browser falls back to printing it. */
  const hit = await cachedExplanation(testId, n);
  if (hit) {
    const parsed = parseReply(hit);
    if (parsed) {
      const ok = verify(parsed, ctx.passage);
      return NextResponse.json({ ...ok, answer: answerShown, quote: ok.sentence || null, cached: true });
    }
    return NextResponse.json({ text: hit, quote: verifiedQuote(hit, ctx.passage), cached: true });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Explanations are not switched on yet. Ask your teacher." }, { status: 503 },
    );
  }

  const wanted = answerShown;
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

    const parsed = parseReply(out);
    if (!parsed) {
      // Rare, but a student should still get something useful rather than an error.
      await storeExplanation(testId, n, out);
      return NextResponse.json({ text: out, quote: verifiedQuote(out, ctx.passage), cached: false });
    }
    const ok = verify(parsed, ctx.passage);
    await storeExplanation(testId, n, JSON.stringify(ok));
    return NextResponse.json({ ...ok, answer: answerShown, quote: ok.sentence || null, cached: false });
  } catch (e) {
    console.error("explain failed:", (e as Error).message);
    return NextResponse.json(
      { error: "Could not write an explanation just now. Try again in a moment." },
      { status: 502 },
    );
  }
}
