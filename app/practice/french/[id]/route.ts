import fs from "node:fs/promises";
import path from "node:path";
import { requireStudent } from "@/lib/guard";
import { trainerResponse } from "@/lib/trainer-page";
import { frenchItem } from "@/lib/french";

/**
 * Serves one French trainer, whole, to a signed-in student — same pattern
 * as the German trainers (app/practice/german/[id]/route.ts). Progress is
 * kept with the student's account by lib/trainer-page.ts.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireStudent(`/practice/french/${id}`, ["french"]);

  const item = frenchItem(id);
  if (!item) return new Response("Not found", { status: 404 });

  let html: string;
  try {
    html = await fs.readFile(path.join(process.cwd(), "content", "french", item.file), "utf8");
  } catch {
    return new Response("This trainer is not available right now.", { status: 404 });
  }

  return trainerResponse({ html, trainer: `french/${item.id}`, session, back: { href: "/practice/french", label: "← Back to French" } });
}
