import fs from "node:fs/promises";
import path from "node:path";
import { requireStudent } from "@/lib/guard";
import { englishItem } from "@/lib/english";

/**
 * Serves one English trainer, whole, to a signed-in student — same pattern
 * as the PTE trainers (app/practice/pte/[id]/route.ts). The trainers are
 * complete pages of their own, so they are sent as they are rather than
 * squeezed inside the site's layout.
 */
export const dynamic = "force-dynamic";

const BACK = `
<a href="/practice/english" style="position:fixed;left:14px;bottom:14px;z-index:2147483647;
  background:#1b1b1b;color:#fff;font:700 13px/1 -apple-system,Segoe UI,Roboto,Arial,sans-serif;
  padding:11px 15px;border-radius:100px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.25)">
  ← Back to English</a>`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requireStudent(`/practice/english/${id}`);

  const item = englishItem(id);
  if (!item) return new Response("Not found", { status: 404 });

  let html: string;
  try {
    html = await fs.readFile(path.join(process.cwd(), "content", "english", item.file), "utf8");
  } catch {
    return new Response("This trainer is not available right now.", { status: 404 });
  }

  const at = html.search(/<\/body>/i);
  html = at >= 0 ? html.slice(0, at) + BACK + html.slice(at) : html + BACK;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
