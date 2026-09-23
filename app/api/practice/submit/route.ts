import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTest, getKey } from "@/lib/catalogue";
import { markAttempt, type AnswerKey, type StudentAnswers } from "@/lib/marking";
import { saveAttempt, attemptsReady } from "@/lib/attempts";
import { readSession, COOKIE } from "@/lib/session";
import { typeMap } from "@/lib/qtypes";
import { getEvidence } from "@/lib/evidence";

/**
 * The student's answers come in, the band score goes out.
 * The answer key is read here on the server and never leaves it.
 */
export async function POST(req: NextRequest) {
  let body: { testId?: string; answers?: StudentAnswers; secondsUsed?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Could not read your answers." }, { status: 400 });
  }

  const { testId, answers } = body;
  if (!testId || typeof testId !== "string" || !answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Missing test id or answers." }, { status: 400 });
  }

  // Read the paper and the key separately, so a failure says which one broke.
  // Collapsing both into "that test could not be found" hid a real production
  // fault once already.
  let test;
  try {
    test = await getTest(testId);
  } catch {
    return NextResponse.json(
      { error: `The paper "${testId}" could not be read on the server.` }, { status: 404 },
    );
  }
  let key: AnswerKey;
  try {
    key = await getKey(testId);
  } catch {
    return NextResponse.json(
      { error: "The answer key for this test has not been added yet, so it cannot be marked." },
      { status: 409 },
    );
  }

  if (!Object.keys(key).length) {
    return NextResponse.json(
      { error: "This test does not have an answer key yet, so it cannot be marked." },
      { status: 409 }
    );
  }

  const bands = test.mode === "reading" ? test.bandsReading : test.bandsListening;
  const result = markAttempt(
    key,
    answers,
    test.sections.map((s: { label: string; qs: number[] }) => ({ label: s.label, qs: s.qs })),
    bands,
    test.total
  );

  // Record it against the signed-in student. A failure here must not cost the
  // student their result — they have just sat a 40-question paper — so the
  // score is returned either way and the page says whether it was kept.
  // Tag every question with the kind of question it was, so the analysis can
  // say "matching headings" rather than "the second half of the paper".
  const types = typeMap(test);

  // Where each answer sits in the passage, written down when the paper was made.
  // It is attached here, after marking, and never before: on a gap-fill the
  // sentence contains the answer, so it must not be in the page a student is
  // still sitting. A paper with no evidence file simply gets none, and the
  // review falls back to searching the passage for the answer's own words.
  const evidence = await getEvidence(testId);
  result.questions = result.questions.map((q) => ({
    ...q,
    type: types[String(q.n)] ?? "Other",
    ...(evidence[String(q.n)] ? { ev: evidence[String(q.n)] } : {}),
  }));

  let saved = false;
  try {
    const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
    const store = await cookies();
    const session = secret ? await readSession(store.get(COOKIE)?.value, secret) : null;
    if (session && attemptsReady()) {
      await saveAttempt({
        student_id: session.sid,
        test_id: testId,
        skill: String(test.catalogue?.skill ?? ""),
        result,
        answers: answers as Record<string, unknown>,
        seconds_used: typeof body.secondsUsed === "number" ? body.secondsUsed : undefined,
      });
      saved = true;
    }
  } catch (e) {
    console.error("could not save attempt:", (e as Error).message);
  }

  return NextResponse.json({ ...result, saved });
}
