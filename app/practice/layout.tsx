import type { Metadata } from "next";
import Link from "next/link";
import "./practice.css";

export const metadata: Metadata = {
  title: "Practice Tests — Pioneer Education Center",
  description:
    "Timed IELTS Listening and Reading practice for enrolled Pioneer Education students, marked instantly with a band score.",
  // Student material is private: keep the whole section out of search results.
  robots: { index: false, follow: false },
};

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
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
          <div className="pr-who">
            <span className="av">SK</span>
            <span>
              <span className="nm">Simranjeet Kaur</span>
              <br />
              <span className="cd">PEC-2431</span>
            </span>
          </div>
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
