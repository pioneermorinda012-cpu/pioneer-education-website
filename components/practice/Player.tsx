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
  { test, student }: { test: Test; student?: { name: string; code: string } },
) {
  // General Training runs blue, Academic runs coral — see practice.css
  const track = test.catalogue.skillLabel.startsWith("General") ? "gt" : "ac";
  const [started, setStarted] = useState(false);
  const [name] = useState(student?.name ?? "");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [left, setLeft] = useState(test.minutes * 60);
  const [result, setResult] = useState<Marked | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"s" | "p" | "q">("s");   // reading split state
  const audioRef = useRef<HTMLAudioElement>(null);
  const isReading = test.mode === "reading";

  const set = useCallback((n: number | string, v: string | string[]) => {
    setAnswers((a) => ({ ...a, [String(n)]: v }));
  }, []);

  /* ---- submit ---- */
  const submit = useCallback(async () => {
    if (sending || result) return;
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
  }, [answers, sending, result, test.id]);

  /* ---- timer ---- */
  useEffect(() => {
    if (!started || result) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [started, result]);

  useEffect(() => {
    if (started && left === 0 && !result) void submit();
  }, [left, started, result, submit]);

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
            Your result is saved against this account.
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

  /* ================= the test ================= */
  const section = test.sections[current];
  const lowTime = left <= 300;

  return (
    <div className="wrap" data-track={track} style={{ paddingBottom: 60 }}>
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
            {sending ? "Marking…" : "Submit test ✓"}
          </button>
        )}
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
export function Passage({
  passage, media,
}: {
  passage: NonNullable<Section["passage"]>; media: Record<string, string>;
}) {
  return (
    <article style={{ background: "var(--paper)", border: "1px solid var(--grey-light)",
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
        return (
          <p key={i} style={{ marginBottom: 13 }}>
            {letter && (
              <span style={{ display: "inline-block", fontWeight: 800, color: "var(--coral-dark)",
                background: "var(--coral-light)", borderRadius: 5, padding: "1px 8px", marginRight: 8,
                fontSize: "0.82rem" }}>
                {letter}
              </span>
            )}
            <span dangerouslySetInnerHTML={{ __html: text }} />
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
