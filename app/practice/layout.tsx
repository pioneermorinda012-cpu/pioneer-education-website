import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { readSession, COOKIE } from "@/lib/session";
import SignOut from "@/components/practice/SignOut";
import "./practice.css";

export const metadata: Metadata = {
  title: "Practice Tests — Pioneer Education Center",
  description:
    "Timed IELTS Listening and Reading practice for enrolled Pioneer Education students, marked instantly with a band score.",
  // Student material is private: keep the whole section out of search results.
  robots: { index: false, follow: false },
};

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

export default async function PracticeLayout({ children }: { children: React.ReactNode }) {
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const store = await cookies();
  const session = secret ? await readSession(store.get(COOKIE)?.value, secret) : null;

  return (
    <div className="pr-shell">
      <div className="pr-bar">
        <div className="pr-bar-in">
          <Link href="/" className="home">
            <span className="mk">P</span>
            Pioneer
          </Link>
          <span className="sep">/</span>
          <Link href="/practice" className="here">Practice Tests</Link>
          <span className="grow" />
          {session && (
            <div className="pr-who">
              <span className="av">{initials(session.name)}</span>
              <span>
                <span className="nm">{session.name}</span>
                <br />
                <span className="cd">{session.code}</span>
              </span>
              <SignOut />
            </div>
          )}
        </div>
      </div>

      {children}

      <div className="pr-legal">
        <div className="in">
          <p>
            <b>IELTS®</b> is a registered trademark of the British Council, IDP Education
            Australia and Cambridge University Press &amp; Assessment. Pioneer Education
            Center is not affiliated with, approved by or endorsed by any of them.
          </p>
          <p>
            These practice materials are provided to enrolled students for classroom
            practice only. They are not official IELTS test materials, and a score here is
            a practice estimate rather than an official band.
          </p>
        </div>
      </div>
    </div>
  );
}
