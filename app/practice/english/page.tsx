import Link from "next/link";
import { requireStudent } from "@/lib/guard";
import { ENGLISH } from "@/lib/english";
import { COURSE_LESSONS } from "@/lib/english-course";
import PracticeNav from "@/components/practice/PracticeNav";

export const dynamic = "force-dynamic";

export default async function EnglishLibrary() {
  const session = await requireStudent("/practice/english", ["english"]);

  return (
    <div className="wrap">
      <PracticeNav active="ENGLISH" session={session} />

      <div className="pr-head">
        <h1>English Trainer</h1>
        <span className="meta">{ENGLISH.length} trainers · Pioneer student material</span>
      </div>

      <div className="pr-note">
        Six levels, from A1 (beginner) to C2 (near-native). Start at the level that feels a little difficult, and move up once it feels comfortable.
        Each trainer opens full screen — use the <b>&larr; Back to English</b> button to come back here.
      </div>

      {/* the step-by-step grammar course comes first; the level trainers follow */}
      <div className="ln-first" style={{ marginTop: 18 }}>
        <div><b>English Grammar &amp; Vocabulary course:</b> {COURSE_LESSONS.length} lessons from the basics to IELTS Speaking, in order, with practice and progress saved.</div>
        <Link className="btn btn-coral" href="/practice/english/course" prefetch={false}>Open the course</Link>
      </div>

      <div className="pr-rows" style={{ marginTop: 18 }}>
        {ENGLISH.map((t) => (
          <div className="pr-row" key={t.id}>
            <div>
              <div className="nm">{t.title}</div>
              <div style={{ fontSize: "0.86rem", color: "var(--grey)", margin: "4px 0 6px", lineHeight: 1.5 }}>
                {t.blurb}
              </div>
              <div className="fx">
                {t.tags.map((x) => <span key={x}>{x}</span>)}
              </div>
            </div>
            <span />
            <div className="go">
              <Link className="btn btn-coral" href={`/practice/english/${t.id}`} prefetch={false}>
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
