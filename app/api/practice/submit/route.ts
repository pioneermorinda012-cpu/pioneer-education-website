import { NextRequest, NextResponse } from "next/server";
import { getTest, getKey } from "@/lib/catalogue";
import { markAttempt, type AnswerKey, type StudentAnswers } from "@/lib/marking";

/**
 * The student's answers come in, the band score goes out.
 * The answer key is read here on the server and never leaves it.
 */
export async function POST(req: NextRequest) {
  let body: { testId?: string; answers?: StudentAnswers };
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

  // TODO(next): save this attempt to Supabase against the signed-in student,
  // so the teacher dashboard and progress chart have something to read.

  return NextResponse.json(result);
}
