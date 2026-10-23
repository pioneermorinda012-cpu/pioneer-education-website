import Link from "next/link";
import { requireStudent } from "@/lib/guard";
import { GERMAN } from "@/lib/german";
import PracticeNav from "@/components/practice/PracticeNav";

export const dynamic = "force-dynamic";

export default async function GermanLibrary() {
  const session = await requireStudent("/practice/german", ["german"]);

  return (
    <div className="wrap">
      <PracticeNav active="GERMAN" session={session} />

      <div className="pr-head">
        <h1>German Trainer</h1>
        <span className="meta">{GERMAN.length} trainers · Pioneer student material</span>
      </div>

      <div className="pr-note">
        Three levels, A1 to B1, each built around the Goethe exam: Hören, Lesen, Schreiben and Sprechen. Start with A1 if you are new to German; most visas ask for B1.
        Each trainer opens full screen — use the <b>&larr; Back to German</b> button to come back here.
      </div>

      <div className="pr-rows" style={{ marginTop: 18 }}>
        {GERMAN.map((t) => (
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
              <Link className="btn btn-coral" href={`/practice/german/${t.id}`} prefetch={false}>
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
