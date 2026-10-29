import type { TopicVocab as Vocab } from "@/lib/writing";

/* Before a Task 2 essay: the language of the topic, to learn first.
 * 1. Upgrade your sentences — a basic sentence; tap to see the Band 7+ / C1
 *    way to say it. Students try upgrading it in their head first.
 * 2. Topic words — with a short meaning.
 * 3. Collocations — word partners examiners reward.
 * Plain <details>, so it works without any script and costs nothing to load. */
export default function TopicVocab({ title, v }: { title: string; v: Vocab }) {
  return (
    <details className="tv" open>
      <summary>
        <span className="tv-k">Before you write</span>
        <span className="tv-h">Topic vocabulary: {title}</span>
        <span className="tv-s">Upgrade basic sentences to Band 7+, learn the topic words, then write.</span>
      </summary>

      <section>
        <h3>1 · Upgrade your sentences</h3>
        <p className="tv-p">Read the basic sentence and say a better version yourself, then tap to compare with the Band 7+ version.</p>
        <ol className="tv-up">
          {v.upgrades.map((u, i) => (
            <li key={i}>
              <details>
                <summary><span className="tv-basic">{u.basic}</span><span className="tv-tap">Upgrade ▸</span></summary>
                <div className="tv-better"><b>Band 7+:</b> {u.better}</div>
              </details>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3>2 · Topic words</h3>
        <dl className="tv-words">
          {v.words.map((w) => (
            <div key={w.w}><dt>{w.w}</dt><dd>{w.m}</dd></div>
          ))}
        </dl>
      </section>

      <section>
        <h3>3 · Collocations to use</h3>
        <p className="tv-p">Words that go together naturally — use two or three in your essay.</p>
        <ul className="tv-col">{v.collocations.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>
    </details>
  );
}
