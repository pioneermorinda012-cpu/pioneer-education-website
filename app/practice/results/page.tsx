import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession, COOKIE } from "@/lib/session";
import { attemptsForStudent, attemptsReady } from "@/lib/attempts";
import { getCatalogue } from "@/lib/catalogue";
import Trend from "@/components/practice/Trend";

export const dynamic = "force-dynamic";

const SKILL_NAME: Record<string, string> = {
  AL: "Academic Listening", AR: "Academic Reading",
  GL: "GT Listening", GR: "GT Reading",
};

export default async function ResultsPage() {
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const store = await cookies();
  const session = secret ? await readSession(store.get(COOKIE)?.value, secret) : null;
  if (!session) redirect("/practice/sign-in?next=/practice/results");

  if (!attemptsReady()) {
    return (
      <div className="wrap">
        <div className="pr-head"><h1>My results</h1></div>
        <div className="pr-note">Results are not being stored yet — the database settings are missing.</div>
      </div>
    );
  }

  const [attempts, catalogue] = await Promise.all([
    attemptsForStudent(session.sid),
    getCatalogue(),
  ]);
  const nameOf = (id: string) =>
    catalogue.find((c) => c.id === id)?.name ?? id;

  if (!attempts.length) {
    return (
      <div className="wrap">
        <div className="pr-head"><h1>My results</h1></div>
        <div className="pr-note">
          You have not finished a test yet. Once you do, your band, your progress
          over time and the question types costing you marks all appear here.
        </div>
        <div style={{ marginTop: 18 }}>
          <Link className="btn btn-coral" href="/practice">Go to the tests</Link>
        </div>
      </div>
    );
  }

  /* ---- headline numbers ---- */
  const best = Math.max(...attempts.map((a) => Number(a.band)));
  const latest = Number(attempts[0].band);
  const avg = attempts.reduce((s, a) => s + Number(a.band), 0) / attempts.length;

  /* ---- best band per skill ---- */
  const bySkill: Record<string, number[]> = {};
  for (const a of attempts) (bySkill[a.skill] ??= []).push(Number(a.band));

  /* ---- which question numbers go wrong most often ----
     Position in the paper is a decent proxy for question type: the same
     section of an IELTS paper always tests the same kind of skill. */
  const sectionMiss: Record<string, { wrong: number; total: number }> = {};
  for (const a of attempts) {
    for (const q of a.per_question ?? []) {
      const n = Number(q.n);
      const band = n <= 10 ? "Questions 1–10" : n <= 20 ? "Questions 11–20"
        : n <= 30 ? "Questions 21–30" : "Questions 31–40";
      const slot = (sectionMiss[band] ??= { wrong: 0, total: 0 });
      slot.total++;
      if (!q.correct) slot.wrong++;
    }
  }
  const weak = Object.entries(sectionMiss)
    .map(([label, v]) => ({ label, pct: v.total ? (v.wrong / v.total) * 100 : 0, ...v }))
    .sort((a, b) => b.pct - a.pct);

  /* ---- spelling: right answer, wrong letters ---- */
  let nearMiss = 0;
  for (const a of attempts) {
    for (const q of a.per_question ?? []) {
      if (q.correct || !q.given || q.given === "—") continue;
      const g = q.given.toLowerCase().replace(/[^a-z0-9]/g, "");
      const e = String(q.expected).toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!g || !e) continue;
      if (e.split("/").some((alt) => alt && (alt.startsWith(g.slice(0, 4)) || g.startsWith(alt.slice(0, 4))))) nearMiss++;
    }
  }

  return (
    <div className="wrap">
      <div className="pr-head">
        <h1>My results</h1>
        <span className="meta">{session.name} · {attempts.length} test{attempts.length === 1 ? "" : "s"} completed</span>
      </div>

      <div className="pr-stats">
        <div className="pr-stat"><span className="v">{best.toFixed(1)}</span><span className="k">Best band</span></div>
        <div className="pr-stat"><span className="v">{latest.toFixed(1)}</span><span className="k">Most recent</span></div>
        <div className="pr-stat"><span className="v">{avg.toFixed(1)}</span><span className="k">Average</span></div>
      </div>

      <section className="pr-set">
        <h2>Progress</h2>
        <Trend points={attempts.slice().reverse().map((a) => ({
          band: Number(a.band),
          label: new Date(a.submitted_at).toLocaleDateString(),
        }))} />
      </section>

      <section className="pr-set">
        <h2>Best band by skill</h2>
        <div className="pr-rows">
          {Object.entries(bySkill).map(([skill, bands]) => (
            <div className="pr-row" key={skill}>
              <div>
                <div className="nm">{SKILL_NAME[skill] ?? skill}</div>
                <div className="fx"><span>{bands.length} attempt{bands.length === 1 ? "" : "s"}</span></div>
              </div>
              <span className="pr-band hi"><span className="lb">best</span>{Math.max(...bands).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pr-set">
        <h2>Where you lose marks</h2>
        <div className="pr-rows">
          {weak.map((w) => (
            <div className="pr-row" key={w.label}>
              <div>
                <div className="nm">{w.label}</div>
                <div className="fx"><span>{w.wrong} wrong out of {w.total}</span></div>
              </div>
              <div className="pr-meter"><i style={{ width: `${Math.min(100, w.pct)}%` }} /></div>
              <span className="pr-band none">{w.pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
        {nearMiss > 0 && (
          <div className="pr-note">
            <b>{nearMiss} answer{nearMiss === 1 ? " was" : "s were"} nearly right</b> — the right
            word, spelled wrongly or in the wrong form. In IELTS those score zero.
            Worth practising spelling before anything else: it is the quickest band you will gain.
          </div>
        )}
      </section>

      <section className="pr-set">
        <h2>Every attempt</h2>
        <div className="pr-rows">
          {attempts.map((a) => (
            <div className="pr-row" key={a.id}>
              <div>
                <div className="nm">{nameOf(a.test_id)}</div>
                <div className="fx">
                  <span>{new Date(a.submitted_at).toLocaleString()}</span>
                  <span>{a.raw_score}/{a.total} correct</span>
                </div>
              </div>
              <span className={"pr-band " + (Number(a.band) >= 7 ? "hi" : Number(a.band) >= 5.5 ? "mid" : "lo")}>
                <span className="lb">band</span>{Number(a.band).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
