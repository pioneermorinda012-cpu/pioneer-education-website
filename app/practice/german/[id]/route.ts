import fs from "node:fs/promises";
import path from "node:path";
import { requireStudent } from "@/lib/guard";
import { trainerResponse } from "@/lib/trainer-page";
import { germanItem } from "@/lib/german";

/**
 * Serves one German trainer, whole, to a signed-in student — same pattern
 * as the PTE trainers (app/practice/pte/[id]/route.ts). The trainers are
 * complete pages of their own, so they are sent as they are rather than
 * squeezed inside the site's layout.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireStudent(`/practice/german/${id}`, ["german"]);

  const item = germanItem(id);
  if (!item) return new Response("Not found", { status: 404 });

  let html: string;
  try {
    html = await fs.readFile(path.join(process.cwd(), "content", "german", item.file), "utf8");
  } catch {
    return new Response("This trainer is not available right now.", { status: 404 });
  }

  return trainerResponse({ html, trainer: `german/${item.id}`, session, back: { href: "/practice/german", label: "← Back to German" } });
}
