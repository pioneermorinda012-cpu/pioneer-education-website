import fs from "node:fs/promises";
import path from "node:path";

/**
 * The free English Level Test & Grammar Quiz — public, no sign-in, made to
 * be found on Google and shared on WhatsApp. A 15-question level test at the
 * top, the 16 practice sets below, and the course offer on the result screens
 * only (never in the middle of a quiz). The optional "study plan" form sends
 * to /api/lead as an enquiry, with the same spam checks as the other forms.
 *
 * The page is a whole HTML file in content/free; it is served from here
 * rather than from public/ so the Turnstile site key (which is public by
 * design) can be put into it, and so the address has no ".html".
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const html = await fs.readFile(path.join(process.cwd(), "content", "free", "english-grammar-quiz.html"), "utf8");
  const key = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").replace(/[^A-Za-z0-9_-]/g, "");
  return new Response(html.replace("__TURNSTILE_SITE_KEY__", key), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
