import fs from "node:fs/promises";
import path from "node:path";
import { requireStudent } from "@/lib/guard";
import { trainerResponse } from "@/lib/trainer-page";
import { pteItem } from "@/lib/pte";

/**
 * Serves one PTE trainer, whole, to a signed-in student.
 *
 * The trainers are complete pages of their own, so they are sent as they are
 * rather than squeezed inside the site's layout (an iframe would also block the
 * microphone the Speaking trainer needs). The only thing added is a small
 * "Back to PTE" button, so a student is never stranded on a page with no way
 * back into the practice section.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireStudent(`/practice/pte/${id}`, ["pte"]);

  const item = pteItem(id);
  if (!item) return new Response("Not found", { status: 404 });

  let html: string;
  try {
    html = await fs.readFile(path.join(process.cwd(), "content", "pte", item.file), "utf8");
  } catch {
    return new Response("This trainer is not available right now.", { status: 404 });
  }

  return trainerResponse({ html, trainer: `pte/${item.id}`, session, back: { href: "/practice/pte", label: "← Back to PTE" } });
}
