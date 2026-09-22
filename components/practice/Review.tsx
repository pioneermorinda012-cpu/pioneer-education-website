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
type Choice = { l: string; t: string };
type ReviewEntry = {
  si: number; title?: string; instr?: string; stem: string; covers: number[];
  /** the options the student was choosing between, so a bare "D" means something */
  choices?: Choice[];
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const stripTags = (s: string) =>
  String(s).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/* The wording behind the letters. A review that says the answer was "D" and
 * stops there is no use: the student needs to see what D said, and what they
 * picked instead. Options come from the question, or the group, or the bank
 * printed above it — whichever the paper used. */
const SELF_EVIDENT = /^(TRUE|FALSE|YES|NO|NOT GIVEN)$/i;

function choicesOf(g: Group, q?: { opts?: Test["sections"][number]["groups"][number]["opts"] }): Choice[] | undefined {
  const opts = q?.opts ?? g.opts;
  const bank = g.bank?.length
    ? new Map(g.bank.map(([l, t]) => [l.toLowerCase(), t]))
    : null;

  if (opts?.length) {
    return opts.map((o, i) => {
      const l = typeof o === "object" ? o.l : LETTERS[i] ?? String(i + 1);
      const t = typeof o === "object" ? o.t : String(o);
      // A heading picker's options are bare numerals — "vii" and nothing else,
      // because the wording is in the bank printed above the question. Put the
      // two back together, or the review shows a letter and no lesson.
      if (t === l && !SELF_EVIDENT.test(l)) {
        const fromBank = bank?.get(l.toLowerCase());
        if (fromBank && fromBank !== l) return { l, t: fromBank };
      }
      return { l, t };
    });
  }
  if (g.bank?.length) return g.bank.map(([l, t]) => ({ l, t }));
  return undefined;
}

function reviewIndex(test: Test): Record<string, ReviewEntry> {
  const idx: Record<string, ReviewEntry> = {};
  test.sections.forEach((s, si) => {
    const cover = coverageIn(s);
    const put = (n: number, g: Group, stem: string, choices?: Choice[]) => {
      const covers = cover[n] ?? [n];
      // A three-mark task is one entry, filed under every number it covers.
      covers.forEach((c) => {
        idx[String(c)] = { si, title: g.title, instr: g.instr, stem, covers, choices };
      });
    };
    const fromText = (g: Group, t: string) => {
      for (const m of [...String(t).matchAll(/\{\{(\d+)[a-z]?\}\}/g)]) {
        const n = Number(m[1]);
        // the gap being asked about becomes a blank; its neighbours keep their numbers
        const shown = String(t).replace(/\{\{(\d+)[a-z]?\}\}/g, (_, d) =>
          Number(d) === n ? " _____ " : ` (${d}) `);
        // A gap filled from a word bank still has options behind it.
        put(n, g, stripTags(shown), g.bank?.length ? choicesOf(g) : undefined);
      }
    };
    for (const g of s.groups) {
      g.lines?.forEach((l) => fromText(g, typeof l === "object" ? l.t : l));
      g.table?.forEach((r) => r.forEach((c) => fromText(g, typeof c === "object" ? c.t : c)));
      g.questions?.forEach((q) => put(q.n, g, stripTags(q.stem), choicesOf(g, q)));
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
  Passage: (p: {
    passage: NonNullable<Test["sections"][number]["passage"]>;
    media: Record<string, string>;
    highlight?: string | null;
  }) => React.ReactElement;
}) {
  const [openPassage, setOpenPassage] = useState<number | null>(null);
  const [only, setOnly] = useState<"all" | "wrong">("wrong");
  /* The sentence an explanation quoted, and the passage it belongs to. Asking
   * why an answer is right opens that passage and lights the line up, which is
   * the whole point: a student learns far more from seeing where the answer
   * was hiding than from being told what it was. */
  const [hit, setHit] = useState<{ si: number; quote: string } | null>(null);
  const showQuote = (si: number, quote: string | null) => {
    if (!quote) return;
    setHit({ si, quote });
    setOpenPassage(si);
  };
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
              <div style={{ maxHeight: 460, overflowY: "auto", marginBottom: 14 }}>
                <Passage passage={passage} media={test.mediaUrls}
                  highlight={hit?.si === si ? hit.quote : null} />
              </div>
            )}

            {items.map((q) => (
              <ReviewRow key={q.n} q={q} entry={idx[q.n]} testId={test.id}
                onQuote={(quote) => showQuote(si, quote)} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

/* ---------- one question in the review ---------- */
function ReviewRow({
  q, entry, testId, onQuote,
}: {
  q: MarkedQuestion; entry?: ReviewEntry; testId: string;
  onQuote?: (quote: string | null) => void;
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

      <Options entry={entry} q={q} />

      {!q.correct && (
        <Explain testId={testId} n={entry ? entry.covers[0] : Number(q.n)} onQuote={onQuote} />
      )}
    </div>
  );
}

/* ---------- the options, with the right one and the chosen one marked ----------
 *
 * The marker stores letters, because that is what the student submitted. On
 * its own a letter teaches nothing: "the answer was D" leaves them no wiser
 * than before. So the wording goes back beside it, with the correct option
 * marked and — when they picked one — their own choice marked too.
 *
 * A short list is shown whole, because the distractors are half the lesson. A
 * long one (a list of ten headings, a bank of words) would bury the answer, so
 * only the two lines that matter are shown.
 */
function letters(s: string): string[] {
  if (!s || s === "(blank)" || s === "—") return [];
  return s.split("(")[0].split(/[,/]/).map((x) => x.trim()).filter(Boolean);
}

function Options({ entry, q }: { entry?: ReviewEntry; q: MarkedQuestion }) {
  const all = entry?.choices;
  if (!all?.length) return null;

  const want = letters(q.expected).map((x) => x.toLowerCase());
  const got = letters(q.given).map((x) => x.toLowerCase());
  if (!want.length) return null;

  const isRight = (c: Choice) => want.includes(c.l.toLowerCase());
  const isMine = (c: Choice) => got.includes(c.l.toLowerCase());
  const shown = all.length <= 6 ? all : all.filter((c) => isRight(c) || isMine(c));
  if (!shown.length) return null;

  return (
    <div style={{ display: "grid", gap: 4, margin: "10px 0 0 4px" }}>
      {all.length > 6 && (
        <p style={{ margin: "0 0 2px", fontSize: "0.76rem", color: "var(--grey)" }}>
          From the list of {all.length}:
        </p>
      )}
      {shown.map((c) => {
        const right = isRight(c), mine = isMine(c);
        return (
          <div key={c.l}
            style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: "0.85rem",
              lineHeight: 1.45, padding: "6px 9px", borderRadius: 8,
              background: right ? "#E8F5EE" : mine ? "#FBE9E7" : "transparent",
              color: right ? "#0B5D3B" : mine ? "#8E2016" : "var(--navy)" }}>
            <b style={{ flexShrink: 0, minWidth: 18 }}>{c.l}</b>
            <span style={{ flex: 1 }}>{c.t === c.l ? "" : c.t}</span>
            {right && <b style={{ flexShrink: 0, fontSize: "0.74rem" }}>✓ correct</b>}
            {!right && mine && <b style={{ flexShrink: 0, fontSize: "0.74rem" }}>✗ you chose this</b>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- the explanation, written once and then remembered ---------- */

const MARK: React.CSSProperties = {
  background: "#FFE38A", borderRadius: 3, padding: "1px 3px", boxDecorationBreak: "clone",
};

/** Anything the explanation put in quotation marks came out of the passage, so
 *  show it the way it will be shown in the passage: highlighted. */
function withQuotes(s: string, k: string) {
  return s.split(/([“"][^“”"]{8,}[”"])/g).map((p, i) =>
    /^[“"]/.test(p) && p.length > 9
      ? <span key={`${k}-${i}`} style={MARK}>{p}</span>
      : <span key={`${k}-${i}`}>{p}</span>);
}

function ExplainText({ text }: { text: string }) {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  return (
    <div style={{ display: "grid", gap: 7 }}>
      {lines.map((line, i) => {
        const m = line.match(/^(?:\d+[.)]\s*)?(Keywords|In the passage|Why|Answer)\s*:\s*([\s\S]*)$/i);
        return m ? (
          <p key={i} style={{ margin: 0 }}>
            <b style={{ color: "var(--coral-dark)" }}>{m[1]}: </b>
            {withQuotes(m[2], String(i))}
          </p>
        ) : (
          <p key={i} style={{ margin: 0 }}>{withQuotes(line, String(i))}</p>
        );
      })}
    </div>
  );
}

export function Explain({
  testId, n, onQuote,
}: {
  testId: string; n: number;
  /** hands the panel the sentence to light up in the passage */
  onQuote?: (quote: string | null) => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [text, setText] = useState("");
  const [quote, setQuote] = useState<string | null>(null);

  const ask = async () => {
    if (state === "loading") return;
    if (state === "done") { onQuote?.(quote); return; }
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
      const q = data.quote ? String(data.quote) : null;
      setQuote(q);
      onQuote?.(q);
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
    <div style={{ marginTop: 10, background: "var(--gold-light)", borderRadius: 10, padding: "12px 14px",
      fontSize: "0.87rem", lineHeight: 1.65,
      color: state === "error" ? "#A3251A" : "var(--navy)" }}>
      {state === "loading" ? "Working through the passage…" : <ExplainText text={text} />}

      {state === "done" && quote && onQuote && (
        <button type="button" onClick={() => onQuote(quote)}
          style={{ marginTop: 10, border: "1.5px solid var(--navy)", background: "transparent",
            color: "var(--navy)", borderRadius: 9, padding: "6px 11px", cursor: "pointer",
            fontFamily: "inherit", fontWeight: 700, fontSize: "0.76rem", minHeight: 36 }}>
          📍 Show me this line in the passage
        </button>
      )}
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
