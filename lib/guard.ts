import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession, COOKIE, TEACHER_COOKIE, type Session } from "@/lib/session";

/**
 * Who is asking — checked on the page itself, not only at the edge.
 *
 * There is a gate in middleware, and it worked locally while the practice
 * pages were open to anyone in production: a student could reach the whole
 * library without signing in. Whatever the reason a request slips past the
 * edge — a deployment that did not pick the file up, a rewrite, a cached
 * route — the page has to be able to say no by itself. It costs one cookie
 * read, and it cannot be bypassed, because the page will not render without
 * a session in hand.
 *
 * Every page under /practice calls this first, before it reads a paper,
 * touches the database or renders a single word.
 */
export async function requireStudent(next: string): Promise<Session> {
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const store = await cookies();

  if (secret) {
    const student = await readSession(store.get(COOKIE)?.value, secret);
    if (student) return student;

    // A signed-in teacher gets through as well, so a student's marked paper
    // can be opened from the dashboard.
    const teacher = await readSession(store.get(TEACHER_COOKIE)?.value, secret);
    if (teacher && teacher.role === "teacher") return teacher;
  }

  redirect(`/practice/sign-in?next=${encodeURIComponent(next)}`);
}

/** The session if there is one, and no redirect if there is not. */
export async function currentStudent(): Promise<Session | null> {
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  if (!secret) return null;
  const store = await cookies();
  return readSession(store.get(COOKIE)?.value, secret);
}
