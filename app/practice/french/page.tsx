import Link from "next/link";
import { requireStudent } from "@/lib/guard";
import { FRENCH } from "@/lib/french";
import PracticeNav from "@/components/practice/PracticeNav";

export const dynamic = "force-dynamic";

export default async function FrenchLibrary() {
  const session = await requireStudent("/practice/french", ["french"]);

  return (
    <div className="wrap">
      <PracticeNav active="FRENCH" session={session} />

      <div className="pr-head">
        <h1>French Trainer</h1>
        <span className="meta">{FRENCH.length} {FRENCH.length === 1 ? "trainer" : "trainers"} · Pioneer student material</span>
      </div>

      <div className="pr-note">
        Built around the DELF exam: compréhension de l&apos;oral, compréhension des écrits, production écrite and production orale.
        Start with A1 if you are new to French — it begins with the French sounds. A2 and B1 are on the way.
        Your progress is saved to your account, so you can carry on from any phone or computer.
        Each trainer opens full screen — use the <b>&larr; Back to French</b> button to come back here.
      </div>

      <div className="pr-rows" style={{ marginTop: 18 }}>
        {FRENCH.map((t) => (
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
              <Link className="btn btn-coral" href={`/practice/french/${t.id}`} prefetch={false}>
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
