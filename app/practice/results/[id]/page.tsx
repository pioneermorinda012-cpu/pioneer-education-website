import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { readSession, COOKIE, TEACHER_COOKIE } from "@/lib/session";
import { attemptById, attemptsReady } from "@/lib/attempts";
import { getTest } from "@/lib/catalogue";
import AttemptReview from "@/components/practice/AttemptReview";
import type { Test } from "@/components/practice/Player";

export const dynamic = "force-dynamic";

/**
 * One past attempt, reopened.
 *
 * A student may only open their own; a teacher may open anyone's. The paper is
 * loaded fresh from content/ — the stored attempt keeps what was answered, not
 * a copy of the test — and the key still never leaves the server.
 */
export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const store = await cookies();
  const session = secret ? await readSession(store.get(COOKIE)?.value, secret) : null;
  const teacher = secret ? await readSession(store.get(TEACHER_COOKIE)?.value, secret) : null;
  if (!session && !teacher) redirect(`/practice/sign-in?next=/practice/results/${id}`);
  if (!attemptsReady()) notFound();

  const attempt = await attemptById(id);
  if (!attempt) notFound();
  const mine = session && attempt.student_id === session.sid;
  if (!mine && !teacher) notFound();

  let test: Test;
  try {
    test = (await getTest(attempt.test_id)) as Test;
  } catch {
    notFound();
  }

  return (
    <AttemptReview
      test={test}
      questions={attempt.per_question ?? []}
      raw={attempt.raw_score}
      total={attempt.total}
      band={Number(attempt.band)}
      who={mine ? (session?.name ?? "") : attempt.student_id}
      when={attempt.submitted_at}
      back={teacher && !mine ? "/practice/teacher" : "/practice/results"}
    />
  );
}
