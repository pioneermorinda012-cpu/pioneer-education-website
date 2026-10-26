import fs from "node:fs/promises";
import path from "node:path";
import { requireStudent } from "@/lib/guard";
import { allows } from "@/lib/access";
import { labItem } from "@/lib/labs";
import { trainerResponse } from "@/lib/trainer-page";

/**
 * Serves one IELTS skill lab, whole, to a signed-in IELTS student — the same
 * pattern as the English, German and PTE trainers. The back button returns to
 * the section the lab belongs to, and progress is kept with the student's
 * account (lib/trainer-page.ts).
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const item = labItem(id);
  const session = await requireStudent(`/practice/lab/${id}`, item?.need ?? ["academic", "gt"]);
  if (!item) return new Response("Not found", { status: 404 });

  let html: string;
  try {
    html = await fs.readFile(path.join(process.cwd(), "content", "labs", item.file), "utf8");
  } catch {
    return new Response("This lab is not available right now.", { status: 404 });
  }

  const back =
    item.id === "listening" ? { href: "/practice?skill=AL", label: "← Listening tests" } :
    item.id === "reading" ? { href: `/practice?skill=${allows(session, ["academic"]) ? "AR" : "GR"}`, label: "← Reading tests" } :
    item.id === "writing" ? { href: "/practice/writing?task=2", label: "← Writing" } :
    { href: "/practice", label: "← Practice" };

  /* The labs' main column is a flex item that grows to fit its widest line,
   * which pushed the page wider than a phone screen; let it shrink instead. */
  return trainerResponse({ html, trainer: `lab/${item.id}`, session, back, css: "#app{min-width:0;max-width:100%}" });
}
