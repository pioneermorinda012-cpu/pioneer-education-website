import fs from "node:fs/promises";
import path from "node:path";
import { requireStudent } from "@/lib/guard";
import { trainerResponse } from "@/lib/trainer-page";
import { COURSE_KEY, COURSE_TRAINER, VIDEOS, courseLesson } from "@/lib/english-course";

/**
 * One lesson of the English Grammar & Vocabulary course, served whole to a
 * signed-in English student. Three things are added; the lesson file itself
 * is not changed:
 *  - its YouTube video, if one is listed in lib/english-course.ts (the lessons
 *    have an empty VIDEO_URL slot for exactly this);
 *  - progress: the lesson's own score line ("✓ 12 · 20/27") is watched and the
 *    best score kept, which lib/trainer-page.ts copies to the student's account
 *    so the course page can tick the lesson on any phone;
 *  - "← Course" and "Next lesson →" buttons.
 */
export const dynamic = "force-dynamic";

const js = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lesson: string }> },
) {
  const { lesson } = await params;
  const session = await requireStudent(`/practice/english/course/${lesson}`, ["english"]);

  const item = courseLesson(lesson);
  if (!item) return new Response("Not found", { status: 404 });

  let html: string;
  try {
    html = await fs.readFile(path.join(process.cwd(), "content", "english-course", `${item.id}.html`), "utf8");
  } catch {
    return new Response("This lesson is not available right now.", { status: 404 });
  }

  const video = VIDEOS[item.id];
  if (video) html = html.replace(/var VIDEO_URL = "";/, `var VIDEO_URL = ${js(video)};`);

  const track = `<script>(function(){
var ID=${js(item.id)},K=${js(COURSE_KEY)},Q=${item.questions};
function rd(){try{return JSON.parse(localStorage.getItem(K)||"{}")||{};}catch(e){return {};}}
function save(s,d,t){var p=rd(),c=p[ID]||{s:0,d:0,t:t},n={s:Math.max(c.s||0,s),d:Math.max(c.d||0,d),t:t||c.t||Q};
 if(!p[ID]||n.s!==c.s||n.d!==c.d||n.t!==c.t){p[ID]=n;try{localStorage.setItem(K,JSON.stringify(p));}catch(e){}}}
function read(){var el=document.getElementById("stat");if(!el)return;var m=el.textContent.match(/(\\d+)\\s*·\\s*(\\d+)\\s*\\/\\s*(\\d+)/);if(m)save(+m[1],+m[2],+m[3]);}
save(0,0,Q);
var el=document.getElementById("stat");if(el&&window.MutationObserver)new MutationObserver(read).observe(el,{childList:true,characterData:true,subtree:true});
})();</script>`;
  const next = item.next
    ? `<a href="/practice/english/course/${item.next.id}" style="position:fixed;right:14px;bottom:14px;z-index:2147483647;
  max-width:calc(100vw - 150px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  background:#DB6A0C;color:#fff;font:700 13px/1 -apple-system,Segoe UI,Roboto,Arial,sans-serif;
  padding:11px 15px;border-radius:100px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.25)">Next: ${esc(item.next.title)} →</a>`
    : "";
  const at = html.search(/<\/body>/i);
  html = at >= 0 ? html.slice(0, at) + track + next + html.slice(at) : html + track + next;

  return trainerResponse({
    html, trainer: COURSE_TRAINER, session,
    back: { href: `/practice/english/course#${item.unit.key}`, label: "← Course" },
    // room at the bottom so the two buttons never cover the last question
    css: "body{padding-bottom:70px}",
  });
}
