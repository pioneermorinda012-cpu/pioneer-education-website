"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { coverageIn, rangeLabel } from "@/lib/coverage";
import ReviewPanel, { Leaderboard } from "./Review";


/* ---------- the shape of an exported test ---------- */
type Opt = string | { l: string; t: string };
type Row = string | { t: string; bullet?: boolean; sub?: boolean };
type Cell = string | { t: string; h?: boolean; rh?: boolean; span?: number };
type Question = { n: number; stem: string; opts?: Opt[]; multi?: boolean; img?: string; imgCap?: string };
type Group = {
  title?: string; instr?: string; heading?: string; example?: string;
  bankTitle?: string; bank?: [string, string][];
  lines?: Row[]; table?: Cell[][]; questions?: Question[];
  opts?: Opt[]; compact?: boolean; img?: string; imgCap?: string;
};
type Section = {
  label: string; qs: number[]; groups: Group[];
  passage?: { title: string; sub?: string; paras: (string | { l?: string; t: string })[]; img?: string; imgCap?: string };
};
export type Test = {
  id: string; name: string; mode: "listening" | "reading"; minutes: number; total: number;
  blurb: string; rules: string[]; sections: Section[];
  audioId?: string; sectionStarts?: number[];
  mediaUrls: Record<string, string>;
  catalogue: { label: string; skillLabel: string };
};

type Answers = Record<string, string | string[]>;
type Marked = {
  raw: number; total: number; band: number;
  sections: { label: string; got: number; outOf: number }[];
  questions: { n: string; correct: boolean; given: string; expected: string; type?: string }[];
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const mmss = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;


/* ================================================================= */
export default function Player(
  { test, student, marked = true }:
  { test: Test; student?: { name: string; code: string }; marked?: boolean },
) {
  // General Training runs blue, Academic runs coral — see practice.css
  const track = test.catalogue.skillLabel.startsWith("General") ? "gt" : "ac";
  const [started, setStarted] = useState(false);
  const [name] = useState(student?.name ?? "");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [left, setLeft] = useState(test.minutes * 60);
  const [result, setResult] = useState<Marked | null>(null);
  const [done, setDone] = useState(false);   // an unmarked paper, finished
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warned, setWarned] = useState(false);   // told once about blank answers
  const [view, setView] = useState<"s" | "p" | "q">("s");   // reading split state
  const audioRef = useRef<HTMLAudioElement>(null);
  const isReading = test.mode === "reading";

  const set = useCallback((n: number | string, v: string | string[]) => {
    setAnswers((a) => ({ ...a, [String(n)]: v }));
  }, []);

  /* ---- submit ---- */
  const submit = useCallback(async (force = false) => {
    if (sending || result) return;
    // No key on the server yet. Sending it would only come back as an error,
    // so the paper simply ends here and the student is shown what they wrote,
    // to mark against the book themselves. Far better than a paper they are
    // not allowed to open at all.
    /* A blank is a mark thrown away, and an unanswered question is almost
     * always a question the student meant to come back to rather than one they
     * chose to skip. Say so once, plainly, and then get out of the way — the
     * second press goes through whatever is left empty, and the clock running
     * out never asks at all. */
    if (!force && !warned) {
      let blank = 0;
      for (const s of test.sections) {
        for (const [lead, claimed] of Object.entries(coverageIn(s))) {
          const v = answers[lead];
          const filled = Array.isArray(v)
            ? Math.min(v.filter(Boolean).length, claimed.length)
            : v != null && String(v).trim() !== "" ? 1 : 0;
          blank += claimed.length - filled;
        }
      }
      if (blank > 0) {
        setWarned(true);
        setError(
          `${blank} question${blank === 1 ? " is" : "s are"} still blank. ` +
          `There is no penalty for a wrong answer in IELTS, so a guess is always worth more ` +
          `than an empty box. Press ${marked ? "Submit test" : "Finish"} again to hand it in as it is.`,
        );
        window.scrollTo(0, 0);
        return;
      }
    }

    if (!marked) { setDone(true); window.scrollTo(0, 0); return; }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: test.id, answers, secondsUsed: test.minutes * 60 - left }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Marking failed.");
      setResult(data as Marked);
      audioRef.current?.pause();
      window.scrollTo(0, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Marking failed. Please try again.");
    } finally {
      setSending(false);
    }
  }, [answers, sending, result, test.id, test.sections, marked, warned, left, test.minutes]);

  /* ---- timer ---- */
  useEffect(() => {
    if (!started || result) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [started, result]);

  useEffect(() => {
    // Time is up: hand it in exactly as it stands, blanks and all.
    if (started && left === 0 && !result && !done) void submit(true);
  }, [left, started, result, done, submit]);

  const covers = useMemo(
    () => test.sections.map((s) => coverageIn(s)),
    [test.sections],
  );

  /* A three-mark task counts as three answered once three boxes are ticked,
   * so "11/13" no longer appears on a paper the student has finished. */
  const answeredIn = (s: Section, si: number) => {
    const cover = covers[si];
    let done = 0;
    for (const [lead, claimed] of Object.entries(cover)) {
      const v = answers[lead];
      if (Array.isArray(v)) done += Math.min(v.length, claimed.length);
      else if (v != null && String(v).trim() !== "") done += 1;
    }
    return Math.min(done, s.qs.length);
  };

  /* ================= start screen ================= */
  if (!started) {
    return (
      <div className="wrap" data-track={track} style={{ maxWidth: 720, paddingTop: 36, paddingBottom: 60 }}>
        <div className="pr-rows" style={{ padding: 28 }}>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.9rem", color: "var(--navy)", marginBottom: 4 }}>
            {test.catalogue.skillLabel} — {test.catalogue.label}
          </h1>
          <p style={{ color: "var(--grey)", marginBottom: 22 }}>{test.blurb}</p>

          <div className="pr-note" style={{ marginTop: 0, marginBottom: 20 }}>
            Signed in as <b>{name || "—"}</b>{student?.code ? <> · {student.code}</> : null}.
            {marked
              ? " Your result is saved against this account."
              : " This paper has no answer key yet, so it will not be given a band score — but everything else works, and you can sit it under exam conditions."}
          </div>

          <ul style={{ paddingLeft: 20, color: "var(--grey)", lineHeight: 1.8, fontSize: "0.92rem", marginBottom: 24 }}>
            {test.rules.map((r, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: r }} />
            ))}
          </ul>

          <button
            className="btn btn-coral" type="button"
            onClick={() => setStarted(true)}
          >
            Start test →
          </button>
        </div>
      </div>
    );
  }

  /* ================= results ================= */
  if (result) return <Results test={test} result={result} name={name} />;

  /* ================= finished, but no key to mark it against =================
     The paper is over and there is nothing to compare it with, so the one
     useful thing left is to hand the student their own answers, in order, in a
     form they can hold next to the book. It is how these were always marked
     before there was a website. */
  if (done) return <Unmarked test={test} answers={answers} name={name} />;

  /* ================= the test ================= */
  const section = test.sections[current];
  const lowTime = left <= 300;
  const answeredAll = test.sections.reduce((n, s, i) => n + answeredIn(s, i), 0);

  return (
    <div className="wrap" data-track={track} style={{ paddingBottom: 96 }}>
      {/* timer + tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
        <div className="pr-skills" style={{ paddingTop: 0, flex: 1 }}>
          {test.sections.map((s, i) => (
            <button
              key={s.label} type="button" onClick={() => { setCurrent(i); window.scrollTo(0, 0); }}
              aria-current={i === current ? "page" : undefined}
              style={{
                flex: "0 0 auto", padding: "8px 16px", borderRadius: 100, cursor: "pointer",
                border: `1.5px solid ${i === current ? "var(--coral)" : "var(--grey-light)"}`,
                background: i === current ? "var(--coral)" : "var(--paper)",
                color: i === current ? "#fff" : "var(--grey)",
                fontWeight: 700, fontSize: "0.82rem", fontFamily: "inherit", whiteSpace: "nowrap",
              }}
            >
              {s.label}
              <span style={{ display: "block", fontSize: "0.62rem", opacity: 0.85 }}>
                {answeredIn(s, i)}/{s.qs.length}
              </span>
            </button>
          ))}
        </div>
        <div className="mono" style={{
          padding: "8px 15px", borderRadius: 100, fontWeight: 700, fontVariantNumeric: "tabular-nums",
          background: lowTime ? "#FBE9E7" : "var(--gold-light)",
          color: lowTime ? "#A3251A" : "var(--navy)",
        }}>
          {mmss(left)}
        </div>
      </div>

      {/* listening audio */}
      {!isReading && test.audioId && (
        <AudioBar
          src={test.mediaUrls[test.audioId]}
          starts={test.sectionStarts ?? []}
          labels={test.sections.map((s) => s.label)}
          onJump={(i) => setCurrent(i)}
          audioRef={audioRef}
        />
      )}

      {/* reading view switch */}
      {isReading && section.passage && (
        <div style={{ display: "flex", gap: 0, margin: "16px 0 4px",
          border: "1.5px solid var(--coral)", borderRadius: 12, overflow: "hidden" }}>
          {([["s", "Split"], ["p", "Passage"], ["q", "Questions"]] as const).map(([v, lbl]) => (
            <button
              key={v} type="button" onClick={() => setView(v)}
              style={{
                flex: 1, padding: "11px 8px", border: "none", cursor: "pointer", fontFamily: "inherit",
                fontWeight: 700, fontSize: "0.85rem", minHeight: 44,
                background: view === v ? "var(--coral)" : "var(--paper)",
                color: view === v ? "#fff" : "var(--coral-dark)",
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      )}

      <div style={
        isReading && section.passage && view === "s"
          ? { display: "grid", gap: 16, gridTemplateColumns: "1fr", alignItems: "start" }
          : {}
      } className={isReading && section.passage && view === "s" ? "pr-split" : undefined}>
        {isReading && section.passage && view !== "q" && (
          <Passage passage={section.passage} media={test.mediaUrls} />
        )}
        {(!isReading || !section.passage || view !== "p") && (
          <div>
            {section.groups.map((g, i) => (
              <GroupBlock key={i} group={g} answers={answers} set={set} media={test.mediaUrls}
                cover={covers[current]} />
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="pr-note" style={{ background: "#FBE9E7", borderColor: "#F0C4BE", color: "#A3251A" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
        {current > 0 && (
          <button className="btn btn-outline" type="button"
            onClick={() => { setCurrent(current - 1); window.scrollTo(0, 0); }}>
            ← Previous
          </button>
        )}
        <span style={{ flex: 1 }} />
        {current < test.sections.length - 1 ? (
          <button className="btn btn-coral" type="button"
            onClick={() => { setCurrent(current + 1); window.scrollTo(0, 0); }}>
            Next →
          </button>
        ) : (
          <button className="btn btn-coral" type="button" onClick={() => void submit()} disabled={sending}>
            {sending ? "Marking…" : marked ? "Submit test ✓" : "Finish ✓"}
          </button>
        )}
        {/* Finishing early should not mean paging back to the last section to
            find the button. */}
        {current < test.sections.length - 1 && (
          <button className="btn btn-outline" type="button" onClick={() => void submit()} disabled={sending}>
            {marked ? "Submit test ✓" : "Finish ✓"}
          </button>
        )}
      </div>

      {/* How much of the paper is done, on screen at all times. In the exam a
          candidate can see their whole answer sheet; on a phone they can see
          about four questions, and without this they have no idea whether they
          have left a dozen behind. */}
      <div className="pr-progress" role="status" aria-live="polite">
        <span className="num">{answeredAll} / {test.total} answered</span>
        <span className="bar">
          <span className="fill" style={{ width: `${Math.round((answeredAll / test.total) * 100)}%` }} />
        </span>
        <span className="num" style={{ color: lowTime ? "#A3251A" : "var(--grey)" }}>{mmss(left)}</span>
      </div>
    </div>
  );
}

/* ================= audio ================= */
function AudioBar({
  src, starts, labels, onJump, audioRef,
}: {
  src: string; starts: number[]; labels: string[];
  onJump: (i: number) => void; audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  return (
    <div style={{ background: "var(--coral-light)", border: "1px solid #F3D9C2", borderRadius: 14,
      padding: 14, marginTop: 16 }}>
      <p style={{ fontWeight: 700, color: "var(--coral-dark)", fontSize: "0.85rem", marginBottom: 9 }}>
        🎧 Test recording — all {labels.length} parts
      </p>
      {/* a normal streamed file: starts instantly and can be scrubbed */}
      <audio ref={audioRef} controls preload="metadata" src={src} style={{ width: "100%", display: "block" }} />
      {starts.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {starts.map((t, i) => (
            <button
              key={i} type="button"
              onClick={() => {
                const a = audioRef.current;
                if (a) { a.currentTime = t; void a.play(); }
                onJump(i);
              }}
              style={{ flex: "1 1 70px", padding: "8px 4px", borderRadius: 8, minHeight: 40,
                border: "1.5px solid var(--coral)", background: "var(--paper)",
                color: "var(--coral-dark)", fontWeight: 700, fontSize: "0.76rem",
                cursor: "pointer", fontFamily: "inherit" }}
            >
              {labels[i]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= passage ================= */
/* Build a forgiving matcher for a sentence the model quoted back at us. The
 * quote is faithful in its words but not always in its whitespace or its
 * apostrophes, so match on the words and be permissive about everything
 * between and around them. */
function quoteRegex(quote: string): RegExp | null {
  const trimmed = quote.trim().replace(/^[“"'\s]+|[”"'\s.]+$/g, "");
  const words = trimmed.split(/\s+/).filter(Boolean);
  // A quoted sentence is long; an answer key phrase can be two words, or one
  // long one. Anything shorter than that would light up half the passage.
  if (!words.length || (words.length < 2 && trimmed.length < 6)) return null;
  const body = words
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[\\s\\u00a0]+")
    .replace(/['’]/g, "['’]")
    .replace(/["“”]/g, "[\"“”]")
    .replace(/[-–—]/g, "[-–—]");
  // A short phrase can be the answer in more than one place, so mark them all;
  // a whole sentence appears once and marking it twice would be noise.
  const flags = words.length < 4 ? "gi" : "i";
  try {
    return new RegExp(words.length < 4 ? `\\b${body}\\b` : body, flags);
  } catch { return null; }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- putting a mark exactly where the paper says it goes ----------
 *
 * The evidence sentence was copied out of this passage when the paper was
 * written, so it matches the words but not the markup: the passage has bold
 * headings, line breaks and &nbsp; in it and the sentence has none of them.
 *
 * The old code solved that by throwing the markup away — it stripped every tag
 * from any paragraph it wanted to mark, which landed the highlight in the right
 * place and flattened the advert, the table heading and the price list around
 * it. So instead of deleting the tags, read past them: walk the HTML once,
 * collecting the visible characters and remembering where each one came from.
 * Matching happens on the visible text; the marks are then spliced back into
 * the real HTML at the positions that text came from, and everything else on
 * the page survives untouched.
 */
const ENTITY: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
  ndash: "–", mdash: "—", middot: "·", hellip: "…",
};
/* Tags that end a line on screen: two words either side of one of these are
 * not neighbours, so a space goes between them before anything is matched. */
const BREAKS = /^<\/?(br|p|div|li|tr|td|th|h[1-6]|ul|ol|table|blockquote)\b/i;

type Scan = { text: string; at: number[] };

function scan(html: string): Scan {
  const chars: string[] = [];
  const at: number[] = [];
  let i = 0;
  let space = true;              // leading whitespace is not worth recording
  const pushSpace = (pos: number) => {
    if (!space) { chars.push(" "); at.push(pos); space = true; }
  };
  while (i < html.length) {
    const c = html[i];
    if (c === "<") {
      const close = html.indexOf(">", i);
      const tag = html.slice(i, close === -1 ? html.length : close + 1);
      i = close === -1 ? html.length : close + 1;
      if (BREAKS.test(tag)) pushSpace(i);
      continue;
    }
    let ch = c;
    let step = 1;
    if (c === "&") {
      const semi = html.indexOf(";", i);
      if (semi > i && semi - i <= 8) {
        const name = html.slice(i + 1, semi);
        if (ENTITY[name]) { ch = ENTITY[name]; step = semi - i + 1; }
      }
    }
    if (/\s/.test(ch)) pushSpace(i);
    else { chars.push(ch); at.push(i); space = false; }
    i += step;
  }
  return { text: chars.join(""), at };
}

const tidy = (s: string) => s.replace(/\s+/g, " ").trim();

export type EvMark = { label: string; text: string; ok?: boolean };

/** A question label is digits and maybe an en-dash; quote it for a selector. */
export const cssq = (s: string) => s.replace(/["\\]/g, "\\$&");

/** Asked for by the passage, answered by the review: "show me question N". */
export const JUMP_EVENT = "pec:jump-to-question";

/** Scroll something into the middle of the screen and make it blink once. */
export function flashTo(selector: string): boolean {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return false;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.classList.remove("ev-flash");
  void el.offsetWidth;            // restart the animation rather than ignore it
  el.classList.add("ev-flash");
  return true;
}

/** Take the student to the sentence that answers question `label`. */
export const locateEvidence = (label: string) =>
  flashTo(`mark[data-ev="${cssq(label)}"]`);

/** Splice every mark that belongs in this paragraph into its HTML. */
function applyMarks(html: string, marks: EvMark[]): { html: string; hit: boolean } {
  if (!marks.length) return { html, hit: false };
  const s = scan(html);
  const hay = s.text.toLowerCase();

  type Span = { from: number; to: number; m: EvMark };
  const spans: Span[] = [];
  for (const m of marks) {
    const needle = tidy(m.text).toLowerCase();
    if (needle.length < 4) continue;
    const from = hay.indexOf(needle);
    if (from === -1) continue;
    spans.push({ from, to: from + needle.length, m });
  }
  if (!spans.length) return { html, hit: false };

  // Two answers can come from the same sentence. Keep the first and drop
  // anything that would start inside it, so no tag is ever split in half.
  spans.sort((a, b) => a.from - b.from || b.to - a.to);
  const kept: Span[] = [];
  for (const sp of spans) {
    if (kept.length && sp.from < kept[kept.length - 1].to) continue;
    kept.push(sp);
  }

  let out = "";
  let cursor = 0;
  for (const sp of kept) {
    const start = s.at[sp.from];
    const end = sp.to < s.at.length ? s.at[sp.to] : html.length;
    const tone = sp.m.ok === false ? "bad" : "ok";
    out += html.slice(cursor, start);
    out +=
      `<mark class="ev ev-${tone}" data-ev="${esc(sp.m.label)}">` +
      `<sup class="ev-badge" data-jump="${esc(sp.m.label)}" role="button" tabindex="0" ` +
      `title="Back to question ${esc(sp.m.label)}">Q${esc(sp.m.label)}</sup>` +
      html.slice(start, end) +
      `</mark>`;
    cursor = end;
  }
  out += html.slice(cursor);
  return { html: out, hit: true };
}

export function Passage({
  passage, media, highlights, paraMarks, evidence,
}: {
  passage: NonNullable<Section["passage"]>; media: Record<string, string>;
  /** every phrase or sentence that answers a question, tagged with its number */
  highlights?: { quote: string; label: string }[];
  /** whole paragraphs that are the answer — "which paragraph mentions…" */
  paraMarks?: Record<string, string[]>;
  /** the lines the paper itself points at, green if the student got it right */
  evidence?: EvMark[];
}) {
  const hits = useMemo(
    () => (highlights ?? [])
      .map((h) => ({ label: h.label, re: quoteRegex(h.quote) }))
      .filter((h): h is { label: string; re: RegExp } => Boolean(h.re)),
    [highlights],
  );

  // Bring the newest mark into view — a passage is long and the point of
  // marking it is lost if the student has to hunt for the mark.
  useEffect(() => {
    if (!hits.length) return;
    const t = setTimeout(() => {
      const all = document.querySelectorAll("mark[data-hit]");
      all[all.length - 1]?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 140);
    return () => clearTimeout(t);
  }, [hits.length]);

  const marked = (html: string): string => {
    // A line the paper itself points at beats anything worked out from the
    // answer's wording, so the authored marks go on first and the guesswork
    // only fills whatever is left.
    const authored = applyMarks(html, evidence ?? []);
    if (authored.hit) return authored.html;
    if (!hits.length) return html;
    // Rendering the stripped text loses inline italics on a marked paragraph,
    // which is a fair trade for highlights that land in the right place.
    const plain = html.replace(/<[^>]+>/g, "");
    let out = plain, touched = false;
    for (const h of hits) {
      h.re.lastIndex = 0;                       // a /g regex remembers where it got to
      if (!h.re.test(out)) continue;
      h.re.lastIndex = 0;
      touched = true;
      out = out.replace(h.re, (s) =>
        `<mark data-hit style="background:#FFD7A8;border-radius:4px;padding:1px 3px;` +
        `box-shadow:0 0 0 2px #FFD7A8">` +
        `<b style="background:#F3B15E;border-radius:3px;padding:0 4px;margin-right:4px;` +
        `font-size:0.78em;color:#4A2A05">Q${esc(h.label)}</b>${s}</mark>`);
    }
    return touched ? out : html;
  };

  /* The Q badge inside a mark is a way back. A student reading the passage has
   * found the line; what they want next is the question it answered, and
   * hunting for it down the page is exactly the friction that stops people
   * reviewing at all.
   *
   * The passage does not know which questions the review is currently showing —
   * by default it shows only the mistakes, so the row behind a green mark is
   * not on the page at all. So it asks rather than scrolls: the review hears
   * the request, shows every question if it has to, and then scrolls. */
  const article = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = article.current;
    if (!root) return;
    const jump = (e: Event) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-jump]");
      if (!el) return;
      e.preventDefault();
      const label = el.getAttribute("data-jump") ?? "";
      window.dispatchEvent(new CustomEvent(JUMP_EVENT, { detail: label }));
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") jump(e);
    };
    root.addEventListener("click", jump);
    root.addEventListener("keydown", key as EventListener);
    return () => {
      root.removeEventListener("click", jump);
      root.removeEventListener("keydown", key as EventListener);
    };
  }, []);

  return (
    <article ref={article} style={{ background: "var(--paper)", border: "1px solid var(--grey-light)",
      borderRadius: 16, padding: "22px 20px", fontSize: "1rem", lineHeight: 1.75, marginTop: 12 }}>
      <h2 style={{ fontFamily: "'Fraunces',serif", color: "var(--navy)", fontSize: "1.4rem", marginBottom: 4 }}>
        {passage.title}
      </h2>
      {passage.sub && (
        <p style={{ color: "var(--grey)", fontStyle: "italic", marginBottom: 14, fontSize: "0.92rem" }}>
          {passage.sub}
        </p>
      )}
      {passage.paras.map((p, i) => {
        const letter = typeof p === "object" ? p.l : undefined;
        const text = typeof p === "object" ? p.t : p;
        // A "which paragraph contains…" answer is the paragraph itself, so the
        // whole thing is tinted rather than one line inside it.
        const owns = letter ? paraMarks?.[letter] : undefined;
        return (
          <p key={i} data-hit={owns ? "" : undefined}
            style={{ marginBottom: 13, ...(owns ? {
              background: "#FFF3DF", borderLeft: "4px solid #F3B15E",
              borderRadius: 8, padding: "9px 12px", margin: "0 0 13px -4px",
            } : {}) }}>
            {letter && (
              <span style={{ display: "inline-block", fontWeight: 800, color: "var(--coral-dark)",
                background: "var(--coral-light)", borderRadius: 5, padding: "1px 8px", marginRight: 8,
                fontSize: "0.82rem" }}>
                {letter}
              </span>
            )}
            {owns?.map((l) => (
              <b key={l} style={{ background: "#F3B15E", borderRadius: 3, padding: "0 5px",
                marginRight: 5, fontSize: "0.76rem", color: "#4A2A05" }}>
                Q{l}
              </b>
            ))}
            <span dangerouslySetInnerHTML={{ __html: marked(text) }} />
          </p>
        );
      })}
      {passage.img && media[passage.img] && (
        <figure style={{ textAlign: "center", margin: "14px 0 0" }}>
          <img src={media[passage.img]} alt={passage.imgCap ?? ""} style={{ maxWidth: "100%", borderRadius: 10 }} />
          {passage.imgCap && (
            <figcaption style={{ fontSize: "0.78rem", color: "var(--grey)", marginTop: 6 }}>
              {passage.imgCap}
            </figcaption>
          )}
        </figure>
      )}
    </article>
  );
}

/* ================= a group of questions ================= */
function GroupBlock({
  group, answers, set, media, cover,
}: {
  group: Group; answers: Answers; cover?: Record<number, number[]>;
  set: (n: number | string, v: string | string[]) => void;
  media: Record<string, string>;
}) {
  return (
    <section style={{ background: "var(--paper)", border: "1px solid var(--grey-light)",
      borderRadius: 16, padding: "18px 18px", marginTop: 14 }}>
      {group.title && (
        <h3 style={{ fontFamily: "'Fraunces',serif", color: "var(--coral-dark)", fontSize: "1.05rem", marginBottom: 3 }}>
          {group.title}
        </h3>
      )}
      {group.instr && (
        <p style={{ color: "var(--grey)", fontSize: "0.85rem", marginBottom: 12, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: group.instr }} />
      )}
      {group.heading && (
        <p style={{ fontWeight: 800, textAlign: "center", margin: "6px 0 12px", color: "var(--navy)" }}>
          {group.heading}
        </p>
      )}
      {group.example && (
        <p style={{ background: "var(--gold-light)", borderRadius: 9, padding: "9px 12px",
          fontSize: "0.85rem", color: "var(--grey)", marginBottom: 12 }}>
          <b>Example:</b> <span dangerouslySetInnerHTML={{ __html: group.example }} />
        </p>
      )}
      {group.bank && (
        <div style={{ background: "var(--coral-light)", borderRadius: 10, padding: "12px 14px",
          fontSize: "0.88rem", marginBottom: 12, lineHeight: 1.85 }}>
          {group.bankTitle && (
            <b style={{ display: "block", color: "var(--coral-dark)", marginBottom: 5, fontSize: "0.8rem" }}>
              {group.bankTitle}
            </b>
          )}
          {group.bank.map(([l, t]) => (
            <span key={l} style={{ display: "block" }}>
              <b style={{ color: "var(--coral-dark)", display: "inline-block", minWidth: 30 }}>{l}</b> {t}
            </span>
          ))}
        </div>
      )}
      {group.img && media[group.img] && (
        <figure style={{ textAlign: "center", margin: "0 0 14px" }}>
          <img src={media[group.img]} alt={group.imgCap ?? ""} style={{ maxWidth: "100%", borderRadius: 10 }} />
          {group.imgCap && (
            <figcaption style={{ fontSize: "0.78rem", color: "var(--grey)", marginTop: 6 }}>{group.imgCap}</figcaption>
          )}
        </figure>
      )}

      {group.lines?.map((ln, i) => {
        const text = typeof ln === "object" ? ln.t : ln;
        const bullet = typeof ln === "object" && ln.bullet;
        const sub = typeof ln === "object" && ln.sub;
        return (
          <p key={i} style={{ fontSize: "0.98rem", lineHeight: 2.2, margin: "8px 0",
            paddingLeft: sub ? 24 : bullet ? 16 : 0, position: "relative" }}>
            {bullet && <span style={{ position: "absolute", left: 2, color: "var(--coral)", fontWeight: 800 }}>•</span>}
            <Gapped text={text} answers={answers} set={set} />
          </p>
        );
      })}

      {group.table && (
        <div style={{ overflowX: "auto", margin: "10px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <tbody>
              {group.table.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => {
                    const t = typeof cell === "object" ? cell.t : cell;
                    const head = typeof cell === "object" && cell.h;
                    const rh = typeof cell === "object" && cell.rh;
                    const span = (typeof cell === "object" && cell.span) || 1;
                    const Tag = head ? "th" : "td";
                    return (
                      <Tag key={ci} colSpan={span}
                        style={{ border: "1px solid var(--grey-light)", padding: "9px 9px",
                          verticalAlign: "top", lineHeight: 2.1, textAlign: "left",
                          background: head ? "var(--coral-light)" : rh ? "var(--gold-light)" : undefined,
                          color: head ? "var(--coral-dark)" : undefined,
                          fontWeight: head || rh ? 700 : 400 }}>
                        <Gapped text={t} answers={answers} set={set} />
                      </Tag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {group.questions?.map((q) => (
        <QuestionBlock key={q.n} q={q} group={group} answers={answers} set={set} media={media}
          covers={cover?.[q.n] ?? [q.n]} />
      ))}
    </section>
  );
}

/* ---- a line of text with {{n}} answer boxes in it ---- */
function Gapped({
  text, answers, set,
}: {
  text: string; answers: Answers;
  set: (n: number | string, v: string | string[]) => void;
}) {
  const parts = useMemo(() => text.split(/(\{\{\d+[a-z]?\}\})/g), [text]);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\{\{(\d+[a-z]?)\}\}$/);
        if (!m) return <span key={i} dangerouslySetInnerHTML={{ __html: p }} />;
        const n = m[1];
        const v = answers[n];
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, verticalAlign: "middle" }}>
            <span aria-hidden style={{ width: 23, height: 23, borderRadius: "50%", background: "var(--coral-light)",
              color: "var(--coral-dark)", fontWeight: 800, fontSize: "0.7rem", display: "inline-flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {n}
            </span>
            <input
              type="text" aria-label={`Answer ${n}`}
              value={typeof v === "string" ? v : ""}
              onChange={(e) => set(n, e.target.value)}
              autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
              style={{ padding: "7px 9px", border: "1.5px solid var(--grey-light)", borderRadius: 8,
                fontSize: 16, width: 130, maxWidth: "100%", fontFamily: "inherit" }}
            />
          </span>
        );
      })}
    </>
  );
}

/* ---- a question with options ---- */
function QuestionBlock({
  q, group, answers, set, media, covers = [q.n],
}: {
  q: Question; group: Group; answers: Answers; covers?: number[];
  set: (n: number | string, v: string | string[]) => void;
  media: Record<string, string>;
}) {
  const opts = q.opts ?? group.opts ?? [];
  /* "Compact" means show the letter and nothing else, which is right for a
   * list of headings or a TRUE/FALSE row — the wording is in the bank above.
   * It is wrong whenever the options are statements in their own right. The
   * old rule was "more than five options", so a Choose THREE letters task with
   * six statements rendered as six bare letters and the student was asked to
   * pick between A and F with nothing to read. Count the wording instead. */
  const labelsOnly = opts.every((o) => String(typeof o === "object" ? o.t : o).trim().length <= 3);
  const compact = group.compact || labelsOnly;
  const current = answers[String(q.n)];
  const span = covers.length > 1;
  const picked = Array.isArray(current) ? current.length : current ? 1 : 0;

  const toggle = (letter: string) => {
    if (q.multi) {
      const arr = Array.isArray(current) ? [...current] : [];
      const i = arr.indexOf(letter);
      if (i === -1) arr.push(letter);
      else arr.splice(i, 1);
      set(q.n, arr);
    } else {
      set(q.n, letter);
    }
  };

  return (
    <div style={{ margin: "16px 0" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {/* A task worth several marks shows the whole range it covers, so the
            numbers on screen match the numbers the paper promises. */}
        <span style={{ minWidth: span ? 54 : 26, width: span ? "auto" : 26, height: 26,
          padding: span ? "0 9px" : 0, borderRadius: span ? 13 : "50%", background: "var(--coral-light)",
          color: "var(--coral-dark)", fontWeight: 800, fontSize: "0.72rem", display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
          fontVariantNumeric: "tabular-nums" }}>
          {rangeLabel(covers)}
        </span>
        <span style={{ fontSize: "0.98rem", lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: q.stem }} />
      </div>

      {q.img && media[q.img] && (
        <figure style={{ textAlign: "center", margin: "12px 0" }}>
          <img src={media[q.img]} alt={q.imgCap ?? ""} style={{ maxWidth: "100%", borderRadius: 10 }} />
          {q.imgCap && (
            <figcaption style={{ fontSize: "0.78rem", color: "var(--grey)", marginTop: 6 }}>{q.imgCap}</figcaption>
          )}
        </figure>
      )}

      <div style={{ display: "flex", flexWrap: compact ? "wrap" : "nowrap",
        flexDirection: compact ? "row" : "column", gap: compact ? 6 : 2, margin: "6px 0 0 36px" }}>
        {opts.map((o, i) => {
          const letter = typeof o === "object" ? o.l : LETTERS[i];
          const text = typeof o === "object" ? o.t : o;
          const on = q.multi
            ? Array.isArray(current) && current.includes(letter.toLowerCase())
            : current === letter.toLowerCase();
          return (
            <label key={letter}
              style={{
                display: "flex", alignItems: compact ? "center" : "flex-start", gap: 9, cursor: "pointer",
                padding: compact ? "9px 12px" : "9px 8px", borderRadius: 9, minHeight: 44,
                fontSize: "0.96rem", lineHeight: 1.5,
                justifyContent: compact ? "center" : undefined,
                minWidth: compact ? 52 : undefined,
                border: compact ? `1.5px solid ${on ? "var(--coral)" : "var(--grey-light)"}` : "none",
                background: compact && on ? "var(--coral)" : undefined,
                color: compact && on ? "#fff" : undefined,
                fontWeight: compact ? 700 : 400,
              }}>
              <input
                type={q.multi ? "checkbox" : "radio"}
                name={`q${q.n}`} checked={on} onChange={() => toggle(letter.toLowerCase())}
                style={{ width: 20, height: 20, accentColor: "var(--coral)", flexShrink: 0,
                  display: compact ? "none" : "block", marginTop: 2 }}
              />
              {compact ? letter : (
                <>
                  <b style={{ color: "var(--coral-dark)", flexShrink: 0 }}>{letter}</b>
                  {text !== letter && <span>{text}</span>}
                </>
              )}
            </label>
          );
        })}
      </div>

      {span && (
        <p style={{ margin: "7px 0 0 36px", fontSize: "0.78rem", fontWeight: 700,
          color: picked === covers.length ? "#0F7A4D" : "var(--grey)" }}>
          {picked} of {covers.length} chosen — this task is worth {covers.length} marks
          (questions {rangeLabel(covers)}).
        </p>
      )}
    </div>
  );
}

/* ================= results ================= */
function Results({ test, result, name }: { test: Test; result: Marked; name: string }) {
  const [showReview, setShowReview] = useState(true);
  const track = test.catalogue.skillLabel.startsWith("General") ? "gt" : "ac";

  const share = () => {
    const msg =
      `*Pioneer Education Center*\n${test.catalogue.skillLabel} — ${test.catalogue.label}\n\n` +
      `Student: ${name}\nRaw score: ${result.raw}/${result.total}\nBand: ${result.band}\n\n#IELTSwithNarinderSir`;
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  };

  return (
    <div className="wrap" data-track={track} style={{ maxWidth: 900, paddingTop: 30, paddingBottom: 60 }}>
      <div className="pr-rows" style={{ padding: 28, textAlign: "center" }}>
        <div style={{ width: 132, height: 132, borderRadius: "50%", border: "5px double var(--coral)",
          margin: "0 auto 18px", display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", background: "var(--coral-light)" }}>
          <span style={{ fontFamily: "'Fraunces',serif", fontSize: "2.3rem", fontWeight: 700, color: "var(--coral-dark)" }}>
            {result.band}
          </span>
          <span style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: "var(--grey)" }}>BAND SCORE</span>
        </div>

        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.5rem", color: "var(--navy)" }}>
          {name}&rsquo;s result
        </h1>
        <p style={{ color: "var(--grey)", fontSize: "0.9rem" }}>
          {test.catalogue.skillLabel} — {test.catalogue.label}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
          gap: 10, margin: "22px 0" }}>
          <Stat n={`${result.raw}/${result.total}`} l="Raw score" />
          {result.sections.map((s) => (
            <Stat key={s.label} n={`${s.got}/${s.outOf}`} l={s.label} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-coral" type="button" onClick={share}>📲 Share on WhatsApp</button>
          <button className="btn btn-outline" type="button" onClick={() => setShowReview((v) => !v)}>
            {showReview ? "Hide" : "Show"} answer review
          </button>
          <Link className="btn btn-outline" href="/practice">Back to tests</Link>
        </div>
      </div>

      <Leaderboard testId={test.id} band={result.band} />

      {showReview && (
        <ReviewPanel test={test} questions={result.questions} Passage={Passage} />
      )}
    </div>
  );
}


function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div style={{ background: "var(--coral-light)", borderRadius: 12, padding: 13 }}>
      <div className="mono" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--coral-dark)" }}>{n}</div>
      <div style={{ fontSize: "0.7rem", color: "var(--grey)" }}>{l}</div>
    </div>
  );
}

/* ================= a paper with no key yet ================= */
function Unmarked(
  { test, answers, name }:
  { test: Test; answers: Record<string, string | string[]>; name: string },
) {
  /* Read the sheet exactly the way the rest of the paper does — through the
     coverage map. Walking the groups by hand missed every question that is not
     a plain one-box-one-number, which on a reading paper is most of them, and
     it looked up answers under numbers the boxes never wrote to: a student who
     had answered forty questions was told they had answered none. */
  const rows: { n: string; given: string }[] = [];
  let answered = 0;
  for (const s of test.sections) {
    for (const [lead, claimed] of Object.entries(coverageIn(s))) {
      const v = answers[lead];
      const given = Array.isArray(v) ? v.filter(Boolean).join(", ") : String(v ?? "").trim();
      if (given) answered += Array.isArray(v) ? Math.min(v.filter(Boolean).length, claimed.length) : 1;
      rows.push({ n: rangeLabel(claimed), given });
    }
  }
  rows.sort((a, b) => parseInt(a.n, 10) - parseInt(b.n, 10));

  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 30, paddingBottom: 60 }}>
      <div className="pr-head"><h1>Your answers</h1></div>
      <div className="pr-note" style={{ marginTop: 6 }}>
        <b>{name || "You"} answered {answered} of {test.total}.</b> This paper has no
        answer key on the site yet, so there is no band score — mark it against the book
        and keep the sheet. The moment the key is added, the paper becomes markable and
        you can sit it again for a real score.
      </div>

      <section className="pr-set">
        <div className="pr-rows">
          {rows.map((r) => (
            <div className="pr-row" key={r.n} style={{ gridTemplateColumns: "44px 1fr" }}>
              <div className="nm" style={{ color: "var(--grey)" }}>{r.n}</div>
              <div className="nm" style={{ fontWeight: r.given ? 700 : 400, color: r.given ? "var(--navy)" : "var(--grey)" }}>
                {r.given || "— not answered —"}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <button className="btn btn-outline" type="button" onClick={() => window.print()}>
          Print this sheet
        </button>
        <a className="btn btn-coral" href="/practice">Back to the tests</a>
      </div>
    </div>
  );
}
