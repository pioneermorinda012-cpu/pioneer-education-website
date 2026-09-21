import { NextResponse, type NextRequest } from "next/server";
import { readSession, COOKIE, TEACHER_COOKIE } from "@/lib/session";

/* Everything under /practice is for enrolled students only. The sign-in page
 * and the teacher area are the two exceptions — the teacher area carries its
 * own gate, because it needs a different credential. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/practice/sign-in" || pathname.startsWith("/practice/teacher")) {
    return NextResponse.next();
  }

  const secret = process.env.PRACTICE_SESSION_SECRET;
  if (secret) {
    const session = await readSession(req.cookies.get(COOKIE)?.value, secret);
    if (session) return NextResponse.next();

    // A signed-in teacher gets through too, so a student's marked paper can be
    // opened from the dashboard. The page itself still checks who is asking.
    const teacher = await readSession(req.cookies.get(TEACHER_COOKIE)?.value, secret);
    if (teacher && teacher.role === "teacher") return NextResponse.next();
  }

  // An API call should get an error it can act on, not a redirect to HTML.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/practice/sign-in";
  url.search = "";
  url.searchParams.set("next", pathname + (req.nextUrl.search || ""));

  // Tell the browser and the router not to keep this answer. It is only true
  // while the student is signed out, and a cached copy would send them back to
  // the sign-in page moments after they successfully signed in.
  const res = NextResponse.redirect(url);
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
}

export const config = {
  matcher: ["/practice", "/practice/:path*", "/api/practice/submit"],
};
