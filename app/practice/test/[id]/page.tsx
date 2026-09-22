import { notFound } from "next/navigation";
import Player, { type Test } from "@/components/practice/Player";
import { getTest } from "@/lib/catalogue";
import { requireStudent } from "@/lib/guard";

/* A test paper is never prerendered and never cached. It is one student's
 * private material, and it is read only after that student has been
 * identified on this request. */
export const dynamic = "force-dynamic";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Who is sitting the test comes from the signed-in session, not a text box —
  // and the paper is not even opened until that is settled.
  const session = await requireStudent(`/practice/test/${id}`);

  let test: Test;
  try {
    test = (await getTest(id)) as Test;
  } catch {
    notFound();
  }

  // The JSON handed to the browser has no answers in it — see lib/catalogue.ts
  return <Player test={test} student={{ name: session.name, code: session.code }} />;
}
