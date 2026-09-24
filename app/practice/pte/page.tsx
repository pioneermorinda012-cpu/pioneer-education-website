import Link from "next/link";
import { requireStudent } from "@/lib/guard";
import { PTE } from "@/lib/pte";
import PracticeNav from "@/components/practice/PracticeNav";

export const dynamic = "force-dynamic";

export default async function PteLibrary() {
  await requireStudent("/practice/pte");

  return (
    <div className="wrap">
      <PracticeNav active="PTE" />

      <div className="pr-head">
        <h1>PTE Academic</h1>
        <span className="meta">{PTE.length} trainers · Pioneer student material</span>
      </div>

      <div className="pr-note">
        New to PTE? Take the diagnostic first, then practise the question types it shows you are losing marks on.
        Each trainer opens full screen — use the <b>← Back to PTE</b> button to come back here.
      </div>

      <div className="pr-rows" style={{ marginTop: 18 }}>
        {PTE.map((t) => (
          <div className="pr-row" key={t.id}>
            <div>
              <div className="nm">{t.title}</div>
              <div style={{ fontSize: "0.86rem", color: "var(--grey)", margin: "4px 0 6px", lineHeight: 1.5 }}>
                {t.blurb}
              </div>
              <div className="fx">
                {t.tags.map((x) => <span key={x}>{x}</span>)}
                {t.mic && <span>🎙 uses your microphone</span>}
              </div>
            </div>
            <span />
            <div className="go">
              <Link className="btn btn-coral" href={`/practice/pte/${t.id}`} prefetch={false}>
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: "0.76rem", color: "var(--grey)", marginTop: 18, lineHeight: 1.6 }}>
        PTE Academic™ is a trademark of Pearson. Pioneer Education Center is not affiliated with or endorsed by Pearson.
      </p>
    </div>
  );
}
