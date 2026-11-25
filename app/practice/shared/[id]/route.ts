import { cookies } from "next/headers";
import { readSession, COOKIE, TEACHER_COOKIE } from "@/lib/session";
import { getShared, sharedReady } from "@/lib/shared-results";

/**
 * A student's exercise, exactly as it looked when they tapped "Send my result"
 * (lib/trainer-page.ts), frozen. Opened from the link they WhatsApp to the
 * teacher.
 *
 * Who may open it: a signed-in teacher, or the student who sent it. The page
 * shows the correct answers, so it is not open to anyone with the link.
 *
 * The saved page came from a student's browser, so it is never trusted: every
 * script is removed, and the response is sent with a sandbox Content Security
 * Policy, so nothing in it can run even if something slipped through — it is
 * drawn, never executed.
 */
export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function page(title: string, body: string, status = 200): Response {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><style>body{margin:0;font:16px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f4f5f8;color:#1b1b1b;display:grid;place-items:center;min-height:100vh;padding:20px;box-sizing:border-box}
.c{background:#fff;border-radius:14px;padding:24px;max-width:420px;box-shadow:0 4px 20px rgba(0,0,0,.08)}h1{font-size:20px;margin:0 0 8px}
a{display:inline-block;margin-top:14px;background:#DB6A0C;color:#fff;padding:11px 16px;border-radius:10px;text-decoration:none;font-weight:700}</style></head>
<body><div class="c">${body}</div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const here = `/practice/shared/${id}`;

  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const store = await cookies();
  const teacher = secret ? await readSession(store.get(TEACHER_COOKIE)?.value, secret) : null;
  const student = secret ? await readSession(store.get(COOKIE)?.value, secret) : null;
  const isTeacher = !!teacher && teacher.role === "teacher";

  if (!isTeacher && !student) {
    return page("Sign in to see this result",
      `<h1>Student result</h1><p>Sign in to the teacher page first, then open this link again.</p>
<a href="/practice/teacher">Teacher sign-in</a>`);
  }
  if (!sharedReady()) return page("Not available", "<h1>Not available</h1><p>Results cannot be opened right now.</p>", 503);

  let r;
  try { r = await getShared(id); }
  catch (e) { console.error("read shared result", e); return page("Not available", "<h1>Please try again</h1><p>The result could not be loaded just now.</p>", 502); }
  if (!r) return page("Not found", "<h1>Result not found</h1><p>This link is wrong or the result was removed.</p>", 404);

  if (!isTeacher && student?.sid !== r.student_id) {
    return page("Teacher only", `<h1>Teacher only</h1><p>Only your teacher can open another student's result.</p>
<a href="/practice/teacher">Teacher sign-in</a>`, 403);
  }

  const when = new Date(r.submitted_at).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata",
  });
  const who = r.name + (r.code ? ` (${r.code})` : "");
  const title = r.title.replace(/\s*·\s*Pioneer Education\s*$/, "") || "Exercise";

  // Belt and braces: the CSP below already stops scripts from running.
  let html = r.html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script\b[^>]*>/gi, "")
    .replace(/<(iframe|object|embed)\b[\s\S]*?(<\/\1\s*>|\/?>)/gi, "")
    .replace(/<base\b[^>]*>/gi, "")
    .replace(/<meta\b[^>]*http-equiv[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  const css = `<style>
#pp-frozen{position:sticky;top:0;z-index:2147483647;background:#1b1b1b;color:#fff;font:14px/1.4 -apple-system,Segoe UI,Roboto,Arial,sans-serif;
  padding:10px 14px;display:flex;flex-wrap:wrap;gap:4px 14px;align-items:center;box-shadow:0 2px 10px rgba(0,0,0,.25)}
#pp-frozen b{font-size:15px}#pp-frozen .s{background:#DB6A0C;padding:3px 10px;border-radius:100px;font-weight:700}
#pp-frozen .t{opacity:.75;font-size:12px}
input,textarea,select,button,a,label{pointer-events:none!important}
</style>`;
  const banner = `<div id="pp-frozen">🔒 <b>${esc(who)}</b><span>${esc(title)}</span>${r.score ? `<span class="s">${esc(r.score)}</span>` : ""}<span class="t">Sent ${esc(when)} · read-only</span></div>`;

  const head = html.search(/<\/head>/i);
  html = head >= 0 ? html.slice(0, head) + css + html.slice(head) : css + html;
  const bodyAt = html.search(/<body\b[^>]*>/i);
  if (bodyAt >= 0) {
    const end = html.indexOf(">", bodyAt) + 1;
    html = html.slice(0, end) + banner + html.slice(end);
  } else {
    html = banner + html;
  }

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
      "Content-Security-Policy":
        "sandbox; script-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'none'",
    },
  });
}
