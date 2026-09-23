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
import { locateEvidence, flashTo, cssq, JUMP_EVENT, type EvMark, type Test } from "./Player";

export type MarkedQuestion = {
  n: string; correct: boolean; given: string; expected: string; type?: string;
  /** the line in the passage the paper points at — see lib/evidence */
  ev?: { s: number; t: string[] };
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


/* ---------- finding the answer in the passage, without asking anyone ----------
 *
 * For most of an IELTS reading paper the answer IS a phrase from the passage:
 * a gap fill, a short answer, a table or a diagram label is marked right only
 * if the student copied the wording out. So the answer can simply be looked up
 * where it came from — no model, no waiting, no cost, and it cannot be wrong.
 *
 * True/False and multiple choice have no such phrase; those still need the
 * explanation to point at the line. This covers everything else, which on a
 * typical paper is more than half of it.
 */
const NOT_A_PHRASE = /^(TRUE|FALSE|YES|NO|NOT GIVEN)$/i;
const JUST_A_LABEL = /^([A-Za-z]|[ivxlIVXL]+)$/;

function answerPhrases(expected: string): string[] {
  return expected
    // "(the) (tabloid) newspapers" — the optional words are not needed to find it
    .replace(/\([^)]*\)/g, " ")
    .split(/\s*\/\s*|\s*·\s*/)
    .map((s) => s.trim().replace(/[.,;:]+$/, ""))
    .filter((s) => s.length >= 4 && !NOT_A_PHRASE.test(s) && !JUST_A_LABEL.test(s))
    .sort((a, b) => b.length - a.length);
}

/** The letter answer of a "which paragraph…" or heading-match question. */
function answerLetter(expected: string): string | null {
  const s = expected.trim();
  return /^[A-Z]$/.test(s) ? s : null;
}

const flat = (p: NonNullable<Test["sections"][number]["passage"]>) =>
  p.paras.map((x) => (typeof x === "object" ? x.t : x)).join("\n")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

export default function ReviewPanel({
  test, questions, Passage,
}: {
  test: Test;
  questions: MarkedQuestion[];
  /** the player's passage renderer, passed in so there is only one of them */
  Passage: (p: {
    passage: NonNullable<Test["sections"][number]["passage"]>;
    media: Record<string, string>;
    highlights?: { quote: string; label: string }[];
    paraMarks?: Record<string, string[]>;
    evidence?: EvMark[];
  }) => React.ReactElement;
}) {
  const [openPassage, setOpenPassage] = useState<number | null>(null);
  const [only, setOnly] = useState<"all" | "wrong">("wrong");
  /* Every sentence an explanation has quoted so far, tagged with the question
   * it answers. They build up rather than replacing each other: once a student
   * has been through a passage, the whole thing is marked up like a teacher's
   * copy, and the shape of where answers hide becomes visible. */
  const [marks, setMarks] = useState<Record<string, { si: number; quote: string }>>({});
  const [markingAll, setMarkingAll] = useState<number | null>(null);
  const showQuote = (si: number, label: string, quote: string | null, open = true) => {
    if (!quote) return;
    setMarks((m) => ({ ...m, [label]: { si, quote } }));
    if (open) setOpenPassage(si);
  };

  /* One button for the whole passage. Every explanation is stored the first
   * time anyone asks for it, so this is slow once and instant afterwards. */
  const markAll = async (si: number, items: MarkedQuestion[]) => {
    setMarkingAll(si);
    setOpenPassage(si);
    try {
      await Promise.all(items.map(async (q) => {
        const e = idx[q.n];
        const n = e ? e.covers[0] : Number(q.n);
        const label = e ? rangeLabel(e.covers) : q.n;
        if (marks[label]) return;
        try {
          const res = await fetch("/api/practice/explain", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testId: test.id, n }),
          });
          const d = await res.json();
          if (res.ok && d.quote) showQuote(si, label, String(d.quote), false);
        } catch { /* one failure must not stop the rest */ }
      }));
    } finally {
      setMarkingAll(null);
    }
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

  /* Where each answer sits in its passage, worked out from the answer itself.
   * Done once when the review opens, so a student who opens a passage sees it
   * already marked up rather than having to ask question by question. */
  const found = useMemo(() => {
    const out: { si: number; label: string; quote: string }[] = [];
    const paras: { si: number; letter: string; label: string }[] = [];
    for (const q of rows) {
      // The paper already says where this one is; no need to go hunting.
      if (q.ev?.t?.length) continue;
      const e = idx[q.n];
      const si = e?.si ?? 0;
      const passage = test.sections[si]?.passage;
      if (!passage) continue;
      const label = e ? rangeLabel(e.covers) : q.n;
      const hay = flat(passage);
      const phrase = answerPhrases(q.expected).find((p) => hay.includes(p.toLowerCase()));
      if (phrase) { out.push({ si, label, quote: phrase }); continue; }
      const letter = answerLetter(q.expected);
      if (letter && passage.paras.some((p) => typeof p === "object" && p.l === letter)) {
        paras.push({ si, letter, label });
      }
    }
    return { out, paras };
  }, [rows, idx, test.sections]);

  /* The marks the paper was written with. Unlike everything below, these were
   * put there by the person who made the test, so they are exact and they exist
   * for every question — including the True/False and multiple choice ones,
   * where there is no answer phrase to go looking for. Green when the student
   * got it, red when they did not, which turns the passage into the marked-up
   * copy a teacher would hand back. */
  const authoredFor = (si: number): EvMark[] =>
    rows.flatMap((q) =>
      q.ev && q.ev.s === si
        ? q.ev.t.map((text) => ({
            label: idx[q.n] ? rangeLabel(idx[q.n].covers) : q.n,
            text,
            ok: q.correct,
          }))
        : []);

  /* The other direction: a Q badge in the passage asking to be taken back to
   * its question. The filter usually has everything but the mistakes hidden, so
   * the row may not exist yet — drop the filter first, then scroll once React
   * has drawn it. */
  useEffect(() => {
    const onJump = (e: Event) => {
      const label = String((e as CustomEvent).detail ?? "");
      if (!label) return;
      setOnly("all");
      let tries = 0;
      const tick = () => {
        if (flashTo(`[data-qrow="${cssq(label)}"]`) || ++tries > 12) return;
        setTimeout(tick, 40);
      };
      setTimeout(tick, 40);
    };
    window.addEventListener(JUMP_EVENT, onJump);
    return () => window.removeEventListener(JUMP_EVENT, onJump);
  }, []);

  /* Take the student to the line, opening the passage first if it is shut.
   * One frame is not always enough for a long passage to lay out, so it tries
   * again briefly rather than scrolling to the wrong place. */
  const goToEvidence = (si: number, label: string) => {
    setOpenPassage(si);
    let tries = 0;
    const tick = () => {
      if (locateEvidence(label) || ++tries > 12) return;
      setTimeout(tick, 40);
    };
    setTimeout(tick, 40);
  };

  const highlightsFor = (si: number) => {
    const seen = new Set<string>();
    const all = [
      ...found.out.filter((f) => f.si === si).map((f) => ({ label: f.label, quote: f.quote })),
      ...Object.entries(marks).filter(([, v]) => v.si === si).map(([label, v]) => ({ label, quote: v.quote })),
    ];
    // an explained sentence wins over the bare phrase for the same question
    return all.reverse().filter((h) => !seen.has(h.label) && seen.add(h.label)).reverse();
  };
  const paraMarksFor = (si: number) => {
    const m: Record<string, string[]> = {};
    for (const p of found.paras.filter((x) => x.si === si)) (m[p.letter] ??= []).push(p.label);
    return m;
  };

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
        const authored = authoredFor(si);
        // A paper that carries its own marks has nothing to fetch and nothing to
        // wait for, so the marked-up passage is simply open. Asking a student to
        // press a button first is a step between them and the thing they came
        // for. Papers without marks keep the button.
        const open = openPassage === si || (openPassage === null && authored.length > 0);
        return (
          <section key={sec.label} style={{ marginBottom: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <h3 style={{ fontFamily: "'Fraunces',serif", color: "var(--coral-dark)", fontSize: "1.02rem" }}>
                {sec.label}{passage ? ` — ${passage.title}` : ""}
              </h3>
              {passage && (
                <button type="button" onClick={() => setOpenPassage(open ? -1 : si)}
                  style={{ border: "1.5px solid var(--grey-light)", background: "var(--paper)", cursor: "pointer",
                    borderRadius: 9, padding: "6px 11px", fontFamily: "inherit", fontWeight: 700,
                    fontSize: "0.76rem", color: "var(--navy)", minHeight: 36 }}>
                  {open ? "Hide passage"
                    : `📖 Read the passage${authored.length || highlightsFor(si).length || Object.keys(paraMarksFor(si)).length
                        ? " — answers marked" : ""}`}
                </button>
              )}
              {passage && !authored.length && items.some((q) => !q.correct) && (
                <button type="button" disabled={markingAll === si}
                  onClick={() => void markAll(si, items.filter((q) => !q.correct))}
                  style={{ border: "1.5px solid var(--coral)", background: "var(--paper)",
                    cursor: markingAll === si ? "wait" : "pointer", borderRadius: 9, padding: "6px 11px",
                    fontFamily: "inherit", fontWeight: 700, fontSize: "0.76rem",
                    color: "var(--coral-dark)", minHeight: 36 }}>
                  {markingAll === si ? "Marking the passage…" : "🖍 Mark every answer in this passage"}
                </button>
              )}
            </div>

            {passage && open && (
              <>
                {authored.length > 0 && (
                  <p style={{ fontSize: "0.78rem", color: "var(--grey)", margin: "0 0 8px" }}>
                    Every answer is marked in the passage —{" "}
                    <span style={{ background: "#DCF5E6", borderRadius: 4, padding: "1px 6px" }}>green</span>{" "}
                    you got right,{" "}
                    <span style={{ background: "#FDE2E2", borderRadius: 4, padding: "1px 6px" }}>red</span>{" "}
                    you did not. Tap a <b>Q</b> badge to go back to the question.
                  </p>
                )}
                <div style={{ maxHeight: 460, overflowY: "auto", marginBottom: 14 }}>
                  <Passage passage={passage} media={test.mediaUrls} evidence={authored}
                    highlights={highlightsFor(si)} paraMarks={paraMarksFor(si)} />
                </div>
              </>
            )}

            {items.map((q) => {
              const e = idx[q.n];
              const label = e ? rangeLabel(e.covers) : q.n;
              return (
                <ReviewRow key={q.n} q={q} entry={e} testId={test.id}
                  onLocate={q.ev?.t?.length ? () => goToEvidence(si, label) : undefined}
                  onQuote={(quote) => showQuote(si, label, quote)} />
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

/* ---------- one question in the review ---------- */
function ReviewRow({
  q, entry, testId, onQuote, onLocate,
}: {
  q: MarkedQuestion; entry?: ReviewEntry; testId: string;
  onQuote?: (quote: string | null) => void;
  /** present when the paper says where this answer is; scrolls to it */
  onLocate?: () => void;
}) {
  const label = entry ? rangeLabel(entry.covers) : q.n;
  return (
    <div data-qrow={label}
      style={{ border: "1px solid var(--grey-light)", borderLeft: `4px solid ${q.correct ? "#0F7A4D" : "#C2452F"}`,
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

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center",
        margin: "9px 0 0 4px", fontSize: "0.86rem" }}>
        <span>
          You wrote: <b style={{ color: q.correct ? "#0F7A4D" : "#A3251A" }}>{q.given}</b>
        </span>
        {/* The right answer sits next to the wrong one, not in a panel further
            down. A student comparing the two side by side is the whole review. */}
        <span style={{ color: "var(--grey)" }}>
          {q.correct ? "✔ " : "✔ Correct answer: "}
          <b style={{ color: "#0B5D3B" }}>{q.expected}</b>
        </span>
        <span style={{ flex: 1 }} />
        {onLocate && (
          <button type="button" onClick={onLocate}
            style={{ border: "1.5px solid var(--navy)", background: "transparent", color: "var(--navy)",
              borderRadius: 9, padding: "5px 11px", cursor: "pointer", fontFamily: "inherit",
              fontWeight: 700, fontSize: "0.76rem", minHeight: 34, whiteSpace: "nowrap" }}>
            📍 Q{label} in the passage
          </button>
        )}
      </div>

      <Options entry={entry} q={q} />

      {/* Where the paper carries its own marks there is nothing to ask a model
          for: the line is already highlighted and one tap away. The button is
          kept for the older papers, which have no marks yet. */}
      {!q.correct && !onLocate && (
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

/* ---------- the explanation, written once and then remembered ----------
 *
 * Laid out the way an IELTS teacher marks: the words in the question beside
 * the words in the passage that carry the same meaning, then a note joining
 * them. Seeing that "plastic filament" in the question is "the plastic
 * filament during printing" in the passage is the whole skill — a paragraph of
 * prose hides it, two columns show it.
 */

const Q_MARK: React.CSSProperties = {
  background: "#CFEBD8", borderRadius: 3, padding: "1px 4px", fontWeight: 700,
};
const P_MARK: React.CSSProperties = {
  background: "#FFE38A", borderRadius: 3, padding: "1px 4px",
};

type Pair = { question: string; passage: string };
type Explained = { pairs?: Pair[]; sentence?: string; note?: string; text?: string };

export function Explain({
  testId, n, onQuote,
}: {
  testId: string; n: number;
  /** hands the panel the sentence to light up in the passage */
  onQuote?: (quote: string | null) => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [data, setData] = useState<Explained | null>(null);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState("");
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
      const d = await res.json();
      if (!res.ok) { setDetail(String(d.detail ?? "")); throw new Error(d.error ?? "Could not write an explanation."); }
      setData(d);
      const q = d.quote ? String(d.quote) : null;
      setQuote(q);
      onQuote?.(q);
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not write an explanation.");
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

  if (state === "loading") {
    return (
      <div style={{ marginTop: 10, background: "var(--gold-light)", borderRadius: 10,
        padding: "12px 14px", fontSize: "0.87rem", color: "var(--navy)" }}>
        Working through the passage…
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={{ marginTop: 10, background: "#FBE9E7", borderRadius: 10, padding: "12px 14px",
        fontSize: "0.87rem", color: "#A3251A" }}>
        {error}
        {detail && (
          // The reason, small and out of the way. A student ignores it; the
          // teacher can read it out down the phone instead of guessing.
          <span style={{ display: "block", marginTop: 5, fontSize: "0.76rem", opacity: 0.85 }}>
            {detail}
          </span>
        )}
      </div>
    );
  }

  const pairs = (data?.pairs ?? []).filter((p) => p.question);
  const note = data?.note ?? data?.text ?? "";

  return (
    <div style={{ marginTop: 10, border: "1px solid var(--grey-light)", borderRadius: 10,
      overflow: "hidden", fontSize: "0.87rem", lineHeight: 1.6 }}>

      {pairs.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#EDE6D6" }}>
              <th style={{ textAlign: "left", padding: "8px 11px", fontSize: "0.8rem",
                color: "var(--navy)", width: "42%", borderRight: "1px solid var(--grey-light)" }}>
                Keywords in the question
              </th>
              <th style={{ textAlign: "left", padding: "8px 11px", fontSize: "0.8rem", color: "var(--navy)" }}>
                The same idea in the passage
              </th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((p, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--grey-light)" }}>
                <td style={{ padding: "9px 11px", verticalAlign: "top",
                  borderRight: "1px solid var(--grey-light)" }}>
                  <span style={Q_MARK}>{p.question}</span>
                </td>
                <td style={{ padding: "9px 11px", verticalAlign: "top" }}>
                  {p.passage
                    ? <span style={P_MARK}>{p.passage}</span>
                    : <span style={{ color: "var(--grey)", fontStyle: "italic" }}>
                        not stated in these words
                      </span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {note && (
        <div style={{ padding: "11px 13px", borderTop: pairs.length ? "1px solid var(--grey-light)" : undefined,
          background: "var(--paper)" }}>
          <b style={{ display: "block", marginBottom: 4, color: "var(--navy)" }}>Note</b>
          <span style={{ color: "var(--navy)" }}>{note}</span>
        </div>
      )}

      {quote && onQuote && (
        <div style={{ padding: "9px 13px", borderTop: "1px solid var(--grey-light)",
          background: "var(--gold-light)" }}>
          <button type="button" onClick={() => onQuote(quote)}
            style={{ border: "1.5px solid var(--navy)", background: "transparent", color: "var(--navy)",
              borderRadius: 9, padding: "6px 11px", cursor: "pointer", fontFamily: "inherit",
              fontWeight: 700, fontSize: "0.76rem", minHeight: 36 }}>
            📍 Show me this line in the passage
          </button>
        </div>
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
