"use client";

/* What the student sees after the marking: the question, the passage it came
 * from, what they wrote, what was right, and — on request — why.
 *
 * Shared by the player (straight after submitting) and by the results page
 * (any earlier attempt, reopened), so a mistake can be worked through in class
 * a week later rather than only in the minute after the timer stops.
 */

import { useEffect, useMemo, useState } from "react";
import { coverageIn, rangeLabel } from "@/lib/coverage";
import type { Test } from "./Player";

export type MarkedQuestion = {
  n: string; correct: boolean; given: string; expected: string; type?: string;
};

type Group = Test["sections"][number]["groups"][number];
type ReviewEntry = { si: number; title?: string; instr?: string; stem: string; covers: number[] };

const stripTags = (s: string) =>
  String(s).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function reviewIndex(test: Test): Record<string, ReviewEntry> {
  const idx: Record<string, ReviewEntry> = {};
  test.sections.forEach((s, si) => {
    const cover = coverageIn(s);
    const put = (n: number, g: Group, stem: string) => {
      const covers = cover[n] ?? [n];
      // A three-mark task is one entry, filed under every number it covers.
      covers.forEach((c) => { idx[String(c)] = { si, title: g.title, instr: g.instr, stem, covers }; });
    };
    const fromText = (g: Group, t: string) => {
      for (const m of [...String(t).matchAll(/\{\{(\d+)[a-z]?\}\}/g)]) {
        const n = Number(m[1]);
        // the gap being asked about becomes a blank; its neighbours keep their numbers
        const shown = String(t).replace(/\{\{(\d+)[a-z]?\}\}/g, (_, d) =>
          Number(d) === n ? " _____ " : ` (${d}) `);
        put(n, g, stripTags(shown));
      }
    };
    for (const g of s.groups) {
      g.lines?.forEach((l) => fromText(g, typeof l === "object" ? l.t : l));
      g.table?.forEach((r) => r.forEach((c) => fromText(g, typeof c === "object" ? c.t : c)));
      g.questions?.forEach((q) => put(q.n, g, stripTags(q.stem)));
    }
  });
  return idx;
}

export default function ReviewPanel({
  test, questions, Passage,
}: {
  test: Test;
  questions: MarkedQuestion[];
  /** the player's passage renderer, passed in so there is only one of them */
  Passage: (p: { passage: NonNullable<Test["sections"][number]["passage"]>; media: Record<string, string> }) => React.ReactElement;
}) {
  const [openPassage, setOpenPassage] = useState<number | null>(null);
  const [only, setOnly] = useState<"all" | "wrong">("wrong");
  const idx = useMemo(() => reviewIndex(test), [test]);

  // One entry per task, not per mark: a question worth three marks is reviewed
  // once, under the range it covers, exactly as it was answered.
  const rows = useMemo(() => {
    const seen = new Set<string>();
    return questions.filter((q) => {
      const e = idx[q.n];
      const lead = e ? String(e.covers[0]) : q.n;
      if (seen.has(lead)) return false;
      seen.add(lead);
      return true;
    });
  }, [questions, idx]);

  const bySection = useMemo(() => {
    const out: { label: string; items: MarkedQuestion[] }[] =
      test.sections.map((s) => ({ label: s.label, items: [] }));
    for (const q of rows) out[idx[q.n]?.si ?? 0].items.push(q);
    return out;
  }, [rows, idx, test.sections]);

  const wrongCount = rows.filter((q) => !q.correct).length;

  return (
    <div className="pr-rows" style={{ padding: 24, marginTop: 18, textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.2rem", color: "var(--navy)", flex: 1 }}>
          Review &amp; explanations
        </h2>
        <div style={{ display: "flex", border: "1.5px solid var(--coral)", borderRadius: 10, overflow: "hidden" }}>
          {([["wrong", `My ${wrongCount} mistake${wrongCount === 1 ? "" : "s"}`], ["all", "Every question"]] as const).map(([v, lbl]) => (
            <button key={v} type="button" onClick={() => setOnly(v)}
              style={{ padding: "8px 13px", border: "none", cursor: "pointer", fontFamily: "inherit",
                fontWeight: 700, fontSize: "0.8rem", minHeight: 40,
                background: only === v ? "var(--coral)" : "var(--paper)",
                color: only === v ? "#fff" : "var(--coral-dark)" }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {!wrongCount && only === "wrong" && (
        <p style={{ color: "#0F7A4D", fontWeight: 700 }}>
          Nothing to correct — every answer was right.
        </p>
      )}

      {bySection.map((sec, si) => {
        const items = sec.items.filter((q) => only === "all" || !q.correct);
        const passage = test.sections[si].passage;
        if (!items.length) return null;
        return (
          <section key={sec.label} style={{ marginBottom: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <h3 style={{ fontFamily: "'Fraunces',serif", color: "var(--coral-dark)", fontSize: "1.02rem" }}>
                {sec.label}{passage ? ` — ${passage.title}` : ""}
              </h3>
              {passage && (
                <button type="button" onClick={() => setOpenPassage(openPassage === si ? null : si)}
                  style={{ border: "1.5px solid var(--grey-light)", background: "var(--paper)", cursor: "pointer",
                    borderRadius: 9, padding: "6px 11px", fontFamily: "inherit", fontWeight: 700,
                    fontSize: "0.76rem", color: "var(--navy)", minHeight: 36 }}>
                  {openPassage === si ? "Hide passage" : "📖 Read the passage"}
                </button>
              )}
            </div>

            {passage && openPassage === si && (
              <div style={{ maxHeight: 420, overflowY: "auto", marginBottom: 14 }}>
                <Passage passage={passage} media={test.mediaUrls} />
              </div>
            )}

            {items.map((q) => (
              <ReviewRow key={q.n} q={q} entry={idx[q.n]} testId={test.id} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

/* ---------- one question in the review ---------- */
function ReviewRow({
  q, entry, testId,
}: {
  q: MarkedQuestion; entry?: ReviewEntry; testId: string;
}) {
  const label = entry ? rangeLabel(entry.covers) : q.n;
  return (
    <div style={{ border: "1px solid var(--grey-light)", borderLeft: `4px solid ${q.correct ? "#0F7A4D" : "#C2452F"}`,
      borderRadius: 11, padding: "12px 14px", marginBottom: 10, background: "var(--paper)" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 800, color: "var(--coral-dark)", fontSize: "0.8rem",
          background: "var(--coral-light)", borderRadius: 11, padding: "3px 9px", flexShrink: 0 }}>
          {label}
        </span>
        <span style={{ flex: 1, minWidth: 200, fontSize: "0.92rem", lineHeight: 1.5 }}>
          {entry?.stem ?? "(question text unavailable)"}
        </span>
        {q.type && (
          <span style={{ fontSize: "0.7rem", color: "var(--grey)", background: "var(--gold-light)",
            borderRadius: 8, padding: "3px 8px", whiteSpace: "nowrap" }}>
            {q.type}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "9px 0 0 4px", fontSize: "0.86rem" }}>
        <span>
          You wrote: <b style={{ color: q.correct ? "#0F7A4D" : "#A3251A" }}>{q.given}</b>
        </span>
        <span style={{ color: "var(--grey)" }}>
          Correct answer: <b style={{ color: "var(--navy)" }}>{q.expected}</b>
        </span>
      </div>

      {!q.correct && <Explain testId={testId} n={entry ? entry.covers[0] : Number(q.n)} />}
    </div>
  );
}

/* ---------- the explanation, written once and then remembered ---------- */
export function Explain({ testId, n }: { testId: string; n: number }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [text, setText] = useState("");

  const ask = async () => {
    if (state === "loading" || state === "done") return;
    setState("loading");
    try {
      const res = await fetch("/api/practice/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, n }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not write an explanation.");
      setText(String(data.text ?? ""));
      setState("done");
    } catch (e) {
      setText(e instanceof Error ? e.message : "Could not write an explanation.");
      setState("error");
    }
  };

  if (state === "idle") {
    return (
      <button type="button" onClick={() => void ask()}
        style={{ marginTop: 10, border: "1.5px solid var(--coral)", background: "var(--paper)",
          color: "var(--coral-dark)", borderRadius: 9, padding: "7px 13px", cursor: "pointer",
          fontFamily: "inherit", fontWeight: 700, fontSize: "0.79rem", minHeight: 38 }}>
        💡 Explain this answer
      </button>
    );
  }

  return (
    <div style={{ marginTop: 10, background: "var(--gold-light)", borderRadius: 10, padding: "11px 13px",
      fontSize: "0.87rem", lineHeight: 1.65, whiteSpace: "pre-wrap",
      color: state === "error" ? "#A3251A" : "var(--navy)" }}>
      {state === "loading" ? "Working through the passage…" : text}
    </div>
  );
}

/* ---------- top ten on this test ---------- */
type Board = { name: string; raw: number; total: number; band: number; seconds: number | null; me?: boolean };

const mmss = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

export function Leaderboard({ testId, band }: { testId: string; band?: number }) {
  const [rows, setRows] = useState<Board[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/practice/leaderboard?testId=${encodeURIComponent(testId)}`)
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => { if (alive) setRows(Array.isArray(d.rows) ? d.rows : []); })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [testId]);

  if (!rows || !rows.length) return null;
  const medal = ["🥇", "🥈", "🥉"];

  return (
    <div className="pr-rows" style={{ padding: 22, marginTop: 18, textAlign: "left" }}>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.1rem", color: "var(--navy)", marginBottom: 4 }}>
        🏆 Top scores on this test
      </h2>
      <p style={{ color: "var(--grey)", fontSize: "0.8rem", marginBottom: 12 }}>
        Each student&rsquo;s best attempt.{band != null ? ` You scored band ${band}.` : ""}
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: r.me ? "var(--coral-light)" : undefined }}>
                <td style={{ padding: "8px 6px", width: 34, textAlign: "center" }}>{medal[i] ?? i + 1}</td>
                <td style={{ padding: "8px 6px", fontWeight: r.me ? 800 : 600 }}>
                  {r.name}{r.me ? " (you)" : ""}
                </td>
                <td className="mono" style={{ padding: "8px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                  {r.raw}/{r.total}
                </td>
                <td className="mono" style={{ padding: "8px 6px", textAlign: "right", fontWeight: 800,
                  color: "var(--coral-dark)", whiteSpace: "nowrap" }}>
                  {r.band}
                </td>
                <td className="mono" style={{ padding: "8px 6px", textAlign: "right", color: "var(--grey)",
                  whiteSpace: "nowrap" }}>
                  {r.seconds != null ? mmss(r.seconds) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
