import fs from "node:fs/promises";
import path from "node:path";
import { requireStudent } from "@/lib/guard";
import { lesson, youTubeId } from "@/lib/learn";

/**
 * Serves one Task 1 lesson, whole, to a signed-in Academic student — the same
 * pattern as the English and German trainers. The lesson's video and a
 * "practise these tasks" link are added at the top, and a back button at the
 * bottom, so the lesson files themselves stay plain and reusable.
 */
export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requireStudent(`/practice/learn/${id}`, ["academic"]);

  const item = lesson(id);
  if (!item) return new Response("Not found", { status: 404 });

  let html: string;
  try {
    html = await fs.readFile(path.join(process.cwd(), "content", "learn", item.file), "utf8");
  } catch {
    return new Response("This lesson is not available right now.", { status: 404 });
  }

  const vid = youTubeId(item.video);
  const practise = `/practice/writing?task=1&type=${encodeURIComponent(item.chartType)}`;
  const top = `
<section class="card" id="video" style="border-color:#d9620b">
  <h2><span class="num">▶</span>Watch first: the video lesson</h2>
  ${vid ? `<div style="position:relative;width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#000;margin:10px 0">
    <iframe src="https://www.youtube-nocookie.com/embed/${vid}?rel=0" title="${esc(item.title)} — video lesson" loading="lazy"
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin" allowfullscreen
      style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe></div>`
    : `<p><a href="${esc(item.video)}" target="_blank" rel="noopener">Watch the video</a></p>`}
  <p class="lead">Then work through the sections below. When you are ready, write a real task:</p>
  <div class="btns"><a class="b" href="${practise}" style="text-decoration:none;font-weight:700;border-radius:100px;padding:8px 16px;background:#d9620b;color:#fff">Practise ${esc(item.chartType.toLowerCase())} tasks →</a>
  <a href="/practice/learn" style="font-weight:700;color:#d9620b;padding:8px 6px">All Task 1 lessons</a></div>
</section>`;
  const back = `
<a href="/practice/learn" style="position:fixed;left:14px;bottom:14px;z-index:2147483647;
  background:#1b1b1b;color:#fff;font:700 13px/1 -apple-system,Segoe UI,Roboto,Arial,sans-serif;
  padding:11px 15px;border-radius:100px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.25)">
  ← All lessons</a>`;

  html = html.replace("<main>", `<main>${top}`);
  html = html.replace('<nav class="toc" aria-label="On this page">', '<nav class="toc" aria-label="On this page"><a href="#video">▶ Video</a>');
  const at = html.search(/<\/body>/i);
  html = at >= 0 ? html.slice(0, at) + back + html.slice(at) : html + back;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
