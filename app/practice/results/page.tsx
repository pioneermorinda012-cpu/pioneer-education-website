import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession, COOKIE } from "@/lib/session";
import { attemptsForStudent, attemptsReady } from "@/lib/attempts";
import { getCatalogue, getTest } from "@/lib/catalogue";
import { contextFor } from "@/lib/qcontext";
import { currentId } from "@/lib/aliases";
import Trend from "@/components/practice/Trend";
import MistakeBook, { type Miss } from "@/components/practice/MistakeBook";
import { byType } from "@/lib/qtypes";

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
  // A test sat before the renaming is still the same paper.
  const nameOf = (id: string) =>
    catalogue.find((c) => c.id === currentId(id))?.name ?? id;

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

  /* ---- accuracy by question type, kept apart for Listening and Reading ----
     A student can be strong at Matching Headings in Reading and hopeless at
     the same skill in Listening, so averaging the two hides the thing worth
     teaching. Attempts sat before question types were recorded simply have
     fewer rows here; nothing breaks. */
  type Row = { correct: boolean; type?: string };
  const readingRows: Row[] = [], listeningRows: Row[] = [];
  for (const a of attempts) {
    const into = a.skill === "AR" || a.skill === "GR" ? readingRows : listeningRows;
    for (const q of a.per_question ?? []) if (q.type) into.push(q);
  }
  const weakReading = byType(readingRows);
  const weakListening = byType(listeningRows);
  const noTypes = !readingRows.length && !listeningRows.length;

  /* ---- every question still unanswered correctly ----
     The chart above says which skill is costing marks; this says exactly
     which questions, so a weakness can actually be worked through. Multi-mark
     tasks repeat their row under each number they cover, so only the first is
     kept. */
  const misses: Miss[] = [];
  for (const a of attempts) {
    // A task worth three marks appears three times, once per number, with the
    // same answer against each. Keep the first and drop the run that follows
    // it, so the list shows tasks to redo rather than the same one three times.
    let prev: { n: number; given: string; expected: string } | null = null;
    for (const q of a.per_question ?? []) {
      const num = Number(q.n);
      const runsOn = Boolean(prev && prev.n + 1 === num &&
        prev.given === q.given && prev.expected === q.expected);
      prev = { n: num, given: q.given, expected: q.expected };
      if (q.correct || runsOn) continue;
      misses.push({
        attemptId: a.id,
        testId: a.test_id,
        testName: nameOf(a.test_id),
        when: a.submitted_at,
        n: String(q.n),
        type: q.type ?? "Other",
        given: q.given,
        expected: q.expected,
      });
    }
  }

  /* ---- put the wording back behind the letters ----
     "Correct answer: D" tells a student nothing a week later. Each paper is
     read once here and the letters expanded into what they actually said. */
  const papers = new Map<string, Awaited<ReturnType<typeof getTest>> | null>();
  for (const id of new Set(misses.map((m) => m.testId))) {
    try { papers.set(id, await getTest(id)); } catch { papers.set(id, null); }
  }
  const split = (s: string) =>
    !s || s === "(blank)" || s === "—" ? [] : s.split("(")[0].split(/[,/]/).map((x) => x.trim()).filter(Boolean);

  for (const m of misses) {
    const paper = papers.get(m.testId);
    if (!paper) continue;
    const ctx = contextFor(paper, Number(m.n));
    if (!ctx?.choices?.length) continue;
    // choices arrive as "D Transfer (the full expression is given…)"
    const wording = (letter: string) => {
      const hit = ctx.choices!.find((c) => c.split(/\s+/)[0].toLowerCase() === letter.toLowerCase());
      return hit ? hit.replace(/^\S+\s+/, "") : null;
    };
    const expectedText = split(m.expected).map(wording).filter(Boolean).join(" · ");
    const givenText = split(m.given).map(wording).filter(Boolean).join(" · ");
    if (expectedText) m.expectedText = expectedText;
    if (givenText) m.givenText = givenText;
  }

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

      {noTypes ? (
        <section className="pr-set">
          <h2>Where you lose marks</h2>
          <div className="pr-note">
            Your next test will show this broken down by question type — matching
            headings, true/false/not given, note completion and so on.
          </div>
        </section>
      ) : (
        <>
          {/* Scored as accuracy, not as failure. "100% wrong" is the worst
              possible first sentence about a student's own work, and it says
              no more than "0 right of 22" does. The weakest type still leads,
              because that is the one worth a lesson. */}
          {[["Reading", weakReading], ["Listening", weakListening]].map(([title, rows]) =>
            (rows as ReturnType<typeof byType>).length ? (
              <section className="pr-set" key={title as string}>
                <h2>{title as string} — your accuracy by question type</h2>
                <div className="pr-rows">
                  {(rows as ReturnType<typeof byType>).map((w) => (
                    <div className="pr-row" key={w.type}>
                      <div>
                        <div className="nm">{w.type}</div>
                        <div className="fx">
                          <span>{w.right} right of {w.total}</span>
                          {w.total < 5 && <span>only seen {w.total} time{w.total === 1 ? "" : "s"}</span>}
                        </div>
                      </div>
                      <div className="pr-meter"><i style={{ width: `${Math.min(100, w.pctRight)}%` }} /></div>
                      <span className={"pr-band " + (w.pctRight >= 75 ? "hi" : w.pctRight >= 50 ? "mid" : "lo")}>
                        {w.pctRight.toFixed(0)}% correct
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </>
      )}

      <section className="pr-set">
        <h2 style={{ marginBottom: 0 }} />
        {nearMiss > 0 && (
          <div className="pr-note" style={{ marginTop: 0 }}>
            <b>{nearMiss} answer{nearMiss === 1 ? " was" : "s were"} nearly right</b> — the right
            word, spelled wrongly or in the wrong form. In IELTS those score zero.
            Worth practising spelling before anything else: it is the quickest band you will gain.
          </div>
        )}
      </section>

      <section className="pr-set">
        <h2>Correct your mistakes</h2>
        <p style={{ color: "var(--grey)", fontSize: "0.88rem", marginBottom: 12 }}>
          Every question you have not yet got right. Narrow it to one test, or to
          one kind of question, and work through them.
        </p>
        <MistakeBook misses={misses} />
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
              {/* Reopen the review: the passage, the right answers and the
                  explanations, days after the test rather than only in the
                  minute the timer stops. */}
              <Link className="btn btn-outline" href={`/practice/results/${a.id}`}
                style={{ padding: "7px 13px", fontSize: "0.8rem", minHeight: 38 }}>
                Review
              </Link>
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
