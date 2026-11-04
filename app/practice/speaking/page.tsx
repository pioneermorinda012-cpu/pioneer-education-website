import { requireStudent } from "@/lib/guard";
import PracticeNav from "@/components/practice/PracticeNav";
import { labItem, type LabItem } from "@/lib/labs";

export const dynamic = "force-dynamic";

/* IELTS Speaking: there are no timed tests for speaking, so this page gathers
 * the speaking material — the 31 answer formulas, the Speaking Lab, and the
 * free Part 1 question bank. */
export default async function Speaking() {
  const session = await requireStudent("/practice/speaking", ["academic", "gt"]);
  const items = [labItem("speaking-formulas"), labItem("speaking")].filter((x): x is LabItem => x !== null);

  return (
    <div className="wrap">
      <PracticeNav active="SPEAKING" session={session} />
      <div className="pr-head">
        <h1>IELTS Speaking</h1>
        <span className="meta">Academic and General Training · Parts 1, 2 and 3</span>
      </div>
      <div className="pr-note">
        Start with the <b>31 Speaking Formulas</b> to learn a pattern for every kind of question, then practise them in the
        <b> Speaking Lab</b>. Tap 🔊 to hear each model answer, then say your own answer aloud. What you write in the boxes is saved to your account.
      </div>

      <div className="pr-rows" style={{ marginTop: 18 }}>
        {items.map((l, i) => (
          <div className="pr-row" key={l.id}>
            <div>
              <div className="nm">{i + 1}. {l.title}</div>
              <div style={{ fontSize: "0.86rem", color: "var(--grey)", margin: "4px 0 0", lineHeight: 1.5 }}>{l.blurb}</div>
            </div>
            <span />
            <div className="go">
              <a className="btn btn-coral" href={`/practice/lab/${l.id}`}>Open</a>
            </div>
          </div>
        ))}
        <div className="pr-row">
          <div>
            <div className="nm">{items.length + 1}. Part 1 Question Bank</div>
            <div style={{ fontSize: "0.86rem", color: "var(--grey)", margin: "4px 0 0", lineHeight: 1.5 }}>
              Real Part 1 questions by topic, to answer aloud with the formulas.
            </div>
          </div>
          <span />
          <div className="go">
            <a className="btn btn-coral" href="/ielts-speaking-part-1-questions.html">Open</a>
          </div>
        </div>
      </div>
    </div>
  );
}
