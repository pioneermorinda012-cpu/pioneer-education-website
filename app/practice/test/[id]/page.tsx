import { notFound } from "next/navigation";
import Player, { type Test } from "@/components/practice/Player";
import { getCatalogue, getTest } from "@/lib/catalogue";

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
  // The JSON handed to the browser has no answers in it — see lib/catalogue.ts
  return <Player test={test} />;
}
