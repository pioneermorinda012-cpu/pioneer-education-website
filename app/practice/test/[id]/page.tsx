import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Player, { type Test } from "@/components/practice/Player";
import { getCatalogue, getTest } from "@/lib/catalogue";
import { readSession, COOKIE } from "@/lib/session";

export async function generateStaticParams() {
  const cat = await getCatalogue();
  return cat.map((t) => ({ id: t.id }));
}

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let test: Test;
  try {
    test = (await getTest(id)) as Test;
  } catch {
    notFound();
  }
  // Who is sitting the test comes from the signed-in session, not a text box.
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const store = await cookies();
  const session = secret ? await readSession(store.get(COOKIE)?.value, secret) : null;

  // The JSON handed to the browser has no answers in it — see lib/catalogue.ts
  return (
    <Player
      test={test}
      student={session ? { name: session.name, code: session.code } : undefined}
    />
  );
}
