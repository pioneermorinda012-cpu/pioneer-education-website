"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { coverageIn, rangeLabel } from "@/lib/coverage";
import ReviewPanel, { Leaderboard, type Transcript } from "./Review";
import { classify } from "@/lib/qtypes";


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
  /** listening: sent by the server with the marked result only */
  transcript?: Transcript | null;
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const mmss = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;


/* ---------- matching headings: drag a heading onto its paragraph ----------
 * In the computer-delivered exam the candidate drags each heading into a box
 * above its paragraph. Here every "list of headings" question gets a dotted
 * box above its paragraph in the passage; a heading can be dragged there (a
 * mouse), or tapped and then the box tapped (a phone, where dragging does not
 * work). Both fill the same answer as the i / ii / iii buttons, so either way
 * of answering works and is marked the same. */
type HeadingDrop = {
  /** paragraph letter -> its question */
  byLetter: Record<string, { n: number; bank: [string, string][] }>;
  /** the groups (by index in the section) whose bank can be dragged */
  groups: Record<number, { ns: number[] }>;
};

const tagless = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function headingDrop(section: Section): HeadingDrop | null {
  if (!section.passage) return null;
  const out: HeadingDrop = { byLetter: {}, groups: {} };
  const letters = new Set(section.passage.paras.map(paraLetter).filter(Boolean));
  section.groups.forEach((g, gi) => {
    if (!g.bank?.length || !g.questions?.length || classify(g) !== "Matching headings") return;
    const mapped = g.questions.map((q) => {
      const m = tagless(q.stem).match(/^(?:Paragraph|Section)\s+([A-Z])$/i);
      return m && letters.has(m[1].toUpperCase()) ? { n: q.n, l: m[1].toUpperCase() } : null;
    });
    // every question must point at a paragraph we can find, or none get boxes
    if (mapped.some((x) => !x)) return;
    for (const x of mapped) out.byLetter[x!.l] = { n: x!.n, bank: g.bank };
    out.groups[gi] = { ns: mapped.map((x) => x!.n) };
  });
  return Object.keys(out.groups).length ? out : null;
}

/** The letter a paragraph starts with: { l: "A" }, "<b>A</b> text" or "<b>Section A</b>". */
function paraLetter(p: string | { l?: string; t: string }): string | undefined {
  if (typeof p === "object") return p.l?.toUpperCase();
  const b = p.match(/^\s*<b>([\s\S]{1,40}?)<\/b>/);
  return b ? tagless(b[1]).match(/^(?:Section |Paragraph )?([A-Z])$/)?.[1] : undefined;
}

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
  const [held, setHeld] = useState<string | null>(null);     // a heading picked up by a tap
  /* The student's own marks: highlights per passage and one notes box for the
   * paper. They last until the test is handed in, whatever view or passage
   * the student moves to. */
  const [hls, setHls] = useState<Record<number, HL[]>>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [focusNote, setFocusNote] = useState<number | null>(null);
  const noteSeq = useRef(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isReading = test.mode === "reading";

  const set = useCallback((n: number | string, v: string | string[]) => {
    setAnswers((a) => ({ ...a, [String(n)]: v }));
  }, []);

  /* Put heading `r` on question `n`. A heading is used once, as in the exam:
   * if it was already on another paragraph of the same task it moves here. */
  const place = useCallback((n: number, r: string, ns: number[]) => {
    setAnswers((a) => {
      const next = { ...a };
      for (const m of ns) if (m !== n && next[String(m)] === r) next[String(m)] = "";
      next[String(n)] = r;
      return next;
    });
    setHeld(null);
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
  const drop = isReading ? headingDrop(section) : null;
  const lowTime = left <= 300;
  const answeredAll = test.sections.reduce((n, s, i) => n + answeredIn(s, i), 0);

  return (
    <div className="wrap" data-track={track} style={{ paddingBottom: 96 }}>
      {/* timer + tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
        <div className="pr-skills" style={{ paddingTop: 0, flex: 1 }}>
          {test.sections.map((s, i) => (
            <button
              key={s.label} type="button" onClick={() => { setCurrent(i); setHeld(null); window.scrollTo(0, 0); }}
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
          onSection={(i) => { setCurrent(i); window.scrollTo(0, 0); }}
          audioRef={audioRef}
          resumeKey={`pec_audio_${test.id}`}
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

      {/* Split view: on a wide screen the passage and the questions sit side by
          side and each scrolls on its own, like the computer-delivered exam, so
          a student can read down the passage without losing the question they
          are on. `key` remounts both panes on a new passage, back at the top. */}
      {isReading && section.passage && (
        <div className="pr-study">
          <span className="pr-study-tip">Select words in the passage to <b>highlight</b> them or make a <b>note</b>.</span>
          <button type="button" className={notesOpen ? "on" : undefined} onClick={() => setNotesOpen((o) => !o)}>
            📝 Notes{notes.length ? ` (${notes.length})` : ""}
          </button>
          {(hls[current]?.length ?? 0) > 0 && (
            <button type="button" onClick={() => setHls((h) => ({ ...h, [current]: (h[current] ?? []).filter((x) => x.note) }))}>
              Clear highlights
            </button>
          )}
        </div>
      )}
      {notesOpen && isReading && (
        <NotesPanel
          notes={notes} sections={test.sections} focus={focusNote}
          onClose={() => setNotesOpen(false)}
          onChange={(id, text) => setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, text } : n)))}
          onDelete={(id) => {
            setNotes((ns) => ns.filter((n) => n.id !== id));
            // its highlight goes with it, as in the exam
            setHls((h) => Object.fromEntries(Object.entries(h).map(([k, v]) => [k, v.filter((x) => x.note !== id)])));
          }}
          onAdd={() => {
            const id = noteSeq.current++;
            setNotes((ns) => [...ns, { id, sec: current, quote: "", text: "" }]);
            setFocusNote(id);
          }}
          onOpen={(n) => { if (n.sec !== current) { setCurrent(n.sec); setHeld(null); } }}
        />
      )}

      {held && (
        <div className="pr-held" role="status">
          <span>Now tap the dotted box for the right paragraph to place heading <b>{held}</b>.</span>
          <button type="button" onClick={() => setHeld(null)}>Cancel</button>
        </div>
      )}

      <div key={current} style={
        isReading && section.passage && view === "s"
          ? { display: "grid", gap: 16, gridTemplateColumns: "1fr", alignItems: "start" }
          : {}
      } className={isReading && section.passage && view === "s" ? "pr-split" : undefined}>
        {isReading && section.passage && view !== "q" && (
          <div className="pr-pane" aria-label="Reading passage" tabIndex={-1}>
            <Passage passage={section.passage} media={test.mediaUrls}
              drops={drop ? { ...drop, answers, held, setHeld, place, set, showBank: view === "p" } : undefined}
              study={{
                hl: hls[current] ?? NO_HL,
                setHl: (f) => setHls((h) => ({ ...h, [current]: f(h[current] ?? []) })),
                addNote: (quote, letter, ranges) => {
                  const id = noteSeq.current++;
                  setNotes((ns) => [...ns, { id, sec: current, quote, letter, text: "" }]);
                  setHls((h) => ({ ...h, [current]: [...(h[current] ?? []), ...ranges.map((r) => ({ ...r, note: id }))] }));
                  setNotesOpen(true);
                  setFocusNote(id);
                },
                openNote: (id) => { setNotesOpen(true); setFocusNote(id); },
              }} />
          </div>
        )}
        {(!isReading || !section.passage || view !== "p") && (
          <div className="pr-pane" aria-label="Questions" tabIndex={-1}>
            {section.groups.map((g, i) => (
              <GroupBlock key={i} group={g} answers={answers} set={set} media={test.mediaUrls}
                wide={!isReading || !section.passage || view === "q"}
                cover={covers[current]}
                drag={drop?.groups[i] ? { ns: drop.groups[i].ns, held, setHeld, place } : undefined} />
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
/* The recording runs the way it does in the exam room: once, straight through.
 *
 * There are no browser controls, because those carry a pause button, a scrub
 * bar and a speed menu, and a student who can pause, rewind or slow the tape
 * is practising a different test. Instead there is one Start button (a
 * browser will not play sound until someone presses something), a progress
 * bar to look at but not drag, and the volume. Anything that tries to pause,
 * seek or change speed anyway — a headphone button, the keyboard's media keys,
 * the right-click menu — is put straight back.
 *
 * The page turns to each new section as the recording reaches it, as the
 * computer-delivered test does; the section tabs still let a student look back
 * at earlier questions. If the page is reloaded the recording carries on from
 * where it had got to rather than starting again, so a reload is not a rewind.
 */
function AudioBar({
  src, starts, labels, onSection, audioRef, resumeKey,
}: {
  src: string; starts: number[]; labels: string[];
  onSection: (i: number) => void; audioRef: React.RefObject<HTMLAudioElement | null>;
  resumeKey: string;
}) {
  const [phase, setPhase] = useState<"ready" | "playing" | "ended" | "error">("ready");
  const [pos, setPos] = useState(0);
  const [len, setLen] = useState(0);
  const [vol, setVol] = useState(1);
  const last = useRef(0);          // the furthest point legitimately reached
  const shownSection = useRef(-1);

  const sectionAt = useCallback((t: number) => {
    let i = 0;
    starts.forEach((st, k) => { if (t >= st) i = k; });
    return i;
  }, [starts]);

  // where an interrupted attempt had got to
  const saved = (() => {
    try { return Number(window.localStorage.getItem(resumeKey)) || 0; } catch { return 0; }
  })();

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (a.seeking) return;
      last.current = a.currentTime;
      setPos(a.currentTime);
      const i = sectionAt(a.currentTime);
      if (i !== shownSection.current) { shownSection.current = i; onSection(i); }
      try { window.localStorage.setItem(resumeKey, String(Math.floor(a.currentTime))); } catch { /* fine */ }
    };
    // Any jump the student makes is undone. Only seeks are watched, not gaps
    // between progress updates, so a slow phone or a background tab never
    // gets wrongly pulled back.
    let undoing = false;
    const onSeeking = () => {
      if (undoing) { undoing = false; return; }
      if (Math.abs(a.currentTime - last.current) > 0.75) { undoing = true; a.currentTime = last.current; }
    };
    const onPause = () => {
      if (!a.ended && phase === "playing") void a.play().catch(() => {});
    };
    const onRate = () => { if (a.playbackRate !== 1) a.playbackRate = 1; };
    const onEnded = () => {
      setPhase("ended");
      try { window.localStorage.removeItem(resumeKey); } catch { /* fine */ }
    };
    const onMeta = () => setLen(a.duration || 0);
    const onError = () => setPhase("error");
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("seeking", onSeeking);
    a.addEventListener("pause", onPause);
    a.addEventListener("ratechange", onRate);
    a.addEventListener("ended", onEnded);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("error", onError);
    // the lock screen and headphone buttons talk to the media session
    const ms = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
    const blocked = ["pause", "seekbackward", "seekforward", "seekto", "previoustrack", "nexttrack"] as const;
    if (ms) for (const act of blocked) { try { ms.setActionHandler(act, () => {}); } catch { /* unsupported */ } }
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("seeking", onSeeking);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ratechange", onRate);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("error", onError);
      if (ms) for (const act of blocked) { try { ms.setActionHandler(act, null); } catch { /* unsupported */ } }
    };
  }, [audioRef, phase, sectionAt, onSection, resumeKey]);

  const start = () => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = 1;
    if (saved > 0 && saved < (a.duration || Infinity)) { a.currentTime = saved; last.current = saved; }
    a.play().then(() => setPhase("playing")).catch(() => setPhase("error"));
  };

  const clock = (t: number) => mmss(Math.max(0, Math.floor(t)));
  const now = sectionAt(pos);

  return (
    <div style={{ background: "var(--coral-light)", border: "1px solid #F3D9C2", borderRadius: 14,
      padding: 14, marginTop: 16 }}>
      <audio ref={audioRef} preload="auto" src={src}
        controlsList="nodownload noplaybackrate"
        onContextMenu={(e) => e.preventDefault()} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <p style={{ fontWeight: 700, color: "var(--coral-dark)", fontSize: "0.85rem", margin: 0, flex: 1, minWidth: 200 }}>
          🎧 {phase === "playing" ? <>Now playing — {labels[now]}</>
            : phase === "ended" ? "The recording has finished. Check your answers, then submit."
            : phase === "error" ? "The recording could not be loaded. Tell your teacher."
            : saved > 0 ? `Recording paused by a page reload at ${clock(saved)} — it carries on from there.`
            : `Test recording — all ${labels.length} parts, played once`}
        </p>
        {(phase === "ready") && (
          <button type="button" className="btn btn-coral" onClick={start}
            style={{ padding: "9px 18px", fontSize: "0.85rem", minHeight: 40 }}>
            ▶ {saved > 0 ? "Continue the recording" : "Start the recording"}
          </button>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem",
          color: "var(--coral-dark)", fontWeight: 700 }}>
          🔊
          <input type="range" min={0} max={1} step={0.05} value={vol} aria-label="Volume"
            onChange={(e) => { const v = Number(e.target.value); setVol(v); if (audioRef.current) audioRef.current.volume = v; }}
            style={{ width: 90, accentColor: "var(--coral)" }} />
        </label>
      </div>

      {/* progress: to look at, not to drag */}
      <div aria-hidden style={{ position: "relative", height: 8, borderRadius: 8, background: "#F3D9C2",
        marginTop: 10, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, width: len ? `${(pos / len) * 100}%` : "0%",
          background: "var(--coral)", transition: "width .25s linear" }} />
        {len > 0 && starts.slice(1).map((t, i) => (
          <span key={i} style={{ position: "absolute", top: 0, bottom: 0, width: 2,
            left: `${(t / len) * 100}%`, background: "var(--paper)" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: "0.72rem",
        color: "var(--coral-dark)", fontVariantNumeric: "tabular-nums" }}>
        <span>{clock(pos)}</span>
        <span>No pausing, skipping or speed changes — just like the exam.</span>
        <span>{len ? clock(len) : "--:--"}</span>
      </div>
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

export type EvMark = { label: string; text: string; ok?: boolean; near?: boolean };

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

/** Take the student to the sentence that answers question `label`.
 *  ~= rather than = because one line can carry several question numbers. */
export const locateEvidence = (label: string) =>
  flashTo(`mark[data-ev~="${cssq(label)}"]`);

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

  /* Two answers can come from the same sentence, and nesting one mark inside
   * another would split a tag in half. So the overlapping ones merge: the
   * first span survives and carries both question numbers on its badge. That
   * is also the truth of it — one line really did answer both — and it keeps
   * the second question's 📍 working, which dropping it quietly did not. */
  spans.sort((a, b) => a.from - b.from || b.to - a.to);
  const kept: (Span & { labels: string[] })[] = [];
  for (const sp of spans) {
    const last = kept[kept.length - 1];
    if (last && sp.from < last.to) {
      if (!last.labels.includes(sp.m.label)) last.labels.push(sp.m.label);
      // one of them wrong makes the shared line a wrong one
      if (sp.m.ok === false) last.m = { ...last.m, ok: false };
      continue;
    }
    kept.push({ ...sp, labels: [sp.m.label] });
  }

  let out = "";
  let cursor = 0;
  for (const sp of kept) {
    const start = s.at[sp.from];
    const end = sp.to < s.at.length ? s.at[sp.to] : html.length;
    const tone = sp.m.ok === false ? "bad" : "ok";
    // A line found by wording rather than pointed at by a teacher is drawn
    // differently, because it is the closest match and not a promise.
    const sure = sp.m.near ? " ev-near" : "";
    out += html.slice(cursor, start);
    const badges = sp.labels
      .map((l) =>
        `<sup class="ev-badge" data-jump="${esc(l)}" role="button" tabindex="0" ` +
        `title="Back to question ${esc(l)}">Q${esc(l)}</sup>`)
      .join("");
    out +=
      `<mark class="ev ev-${tone}${sure}" data-ev="${esc(sp.labels.join(" "))}">` +
      badges +
      html.slice(start, end) +
      `</mark>`;
    cursor = end;
  }
  out += html.slice(cursor);
  return { html: out, hit: true };
}

/** A highlight: paragraph index, then start and end in that paragraph's text. */
type HL = { p: number; s: number; e: number; note?: number };
const NO_HL: HL[] = [];
/** A note card: the words it was made from (if any) and the student's point. */
type Note = { id: number; sec: number; quote: string; letter?: string; text: string };
type Study = {
  hl: HL[];
  setHl: (f: (h: HL[]) => HL[]) => void;
  addNote: (quote: string, letter: string | undefined, ranges: HL[]) => void;
  openNote: (id: number) => void;
};

/* A paragraph's text. Memoised on its HTML: React 19 resets innerHTML on
 * every render of dangerouslySetInnerHTML, and the test clock renders every
 * second, which wiped highlights and any selection the student was making. */
const ParaText = memo(function ParaText({ html, pi }: { html: string; pi?: number }) {
  return <span data-pi={pi} dangerouslySetInnerHTML={{ __html: html }} />;
});

/* ---- the notes panel, like the computer-delivered exam ---- */
function NotesPanel({
  notes, sections, focus, onClose, onChange, onDelete, onAdd, onOpen,
}: {
  notes: Note[]; sections: Section[]; focus: number | null;
  onClose: () => void; onChange: (id: number, text: string) => void;
  onDelete: (id: number) => void; onAdd: () => void; onOpen: (n: Note) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus == null) return;
    const ta = box.current?.querySelector<HTMLTextAreaElement>(`textarea[data-note="${focus}"]`);
    if (ta) { ta.scrollIntoView({ block: "nearest" }); ta.focus(); }
  }, [focus, notes.length]);
  return (
    <aside className="pr-notes" aria-label="Notes">
      <div className="pr-notes-head">
        <b>Notes</b>
        <span>Kept until you submit · not marked</span>
        <button type="button" aria-label="Close notes" onClick={onClose}>✕</button>
      </div>
      <div className="pr-notes-list" ref={box}>
        {!notes.length && (
          <p className="pr-notes-empty">
            Select words in the passage and choose <b>Notes</b> — the words appear here and you can write your own point
            under them. Or add a note of your own below.
          </p>
        )}
        {notes.map((n) => (
          <div key={n.id} className={`pr-note${focus === n.id ? " on" : ""}`}>
            <button type="button" className="pr-note-src" onClick={() => onOpen(n)}>
              <b>{sections[n.sec]?.label ?? ""}{n.letter ? ` · Para ${n.letter}` : ""}</b>
              {n.quote && <i> {n.quote}</i>}
            </button>
            <textarea data-note={n.id} value={n.text} rows={2}
              placeholder={n.quote ? "Your point about these words…" : "Your note…"}
              onChange={(e) => onChange(n.id, e.target.value)} />
            <button type="button" className="pr-note-del" onClick={() => onDelete(n.id)}>Delete</button>
          </div>
        ))}
      </div>
      <button type="button" className="pr-notes-add" onClick={onAdd}>+ Add a note</button>
    </aside>
  );
}

/* Wrap characters [s, e) of an element's text in <mark>, across tags. */
function wrapRange(root: HTMLElement, s: number, e: number, idx: number, note?: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
  let pos = 0;
  for (const node of nodes) {
    const len = node.data.length;
    const a = Math.max(s, pos), b = Math.min(e, pos + len);
    if (a < b) {
      let target = node;
      if (a > pos) target = target.splitText(a - pos);
      if (b < pos + len) target.splitText(b - a);
      const m = document.createElement("mark");
      m.className = note ? "pr-hl pr-hl-note" : "pr-hl";
      m.dataset.hl = String(idx);
      target.parentNode!.insertBefore(m, target);
      m.appendChild(target);
    }
    pos += len;
  }
}

/** Characters from the start of `root` to a point inside it. */
function offsetIn(root: HTMLElement, node: Node, off: number): number {
  const r = document.createRange();
  r.setStart(root, 0);
  r.setEnd(node, off);
  return r.toString().length;
}

type Drops = HeadingDrop & {
  answers: Answers; held: string | null; setHeld: (r: string | null) => void;
  place: (n: number, r: string, ns: number[]) => void;
  set: (n: number | string, v: string | string[]) => void;
  /** Passage view: the questions are hidden, so the headings are shown here. */
  showBank: boolean;
};

export function Passage({
  passage, media, highlights, paraMarks, evidence, drops, study,
}: {
  /** a test in progress: the student's own highlights and notes */
  study?: Study;
  passage: NonNullable<Section["passage"]>; media: Record<string, string>;
  /** a test in progress: dotted boxes for "list of headings" questions */
  drops?: Drops;
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

  /* ---- the student's highlights ----
   * Painted straight onto the paragraphs after React has drawn them: each
   * paragraph is reset to its own text and the marks are wrapped round the
   * saved character ranges, so they survive a change of view or passage. */
  const htmlOf = (i: number) => {
    const p = passage.paras[i];
    return marked(typeof p === "object" ? p.t : p);
  };
  useLayoutEffect(() => {
    const root = article.current;
    if (!root || !study) return;
    root.querySelectorAll<HTMLElement>("[data-pi]").forEach((el) => {
      const i = Number(el.dataset.pi);
      el.innerHTML = htmlOf(i);
      study.hl.forEach((h, idx) => { if (h.p === i) wrapRange(el, h.s, h.e, idx, h.note); });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [study?.hl, passage]);

  // The newest study callbacks, without re-subscribing every second of the clock.
  const opened = useRef(0);
  const studyRef = useRef(study);
  studyRef.current = study;
  const [menu, setMenu] = useState<null | { x: number; y: number; ranges: HL[]; quote: string; letter?: string; hit?: number; note?: number }>(null);
  useEffect(() => {
    const root = article.current;
    if (!root || !studyRef.current) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const read = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) return;
      const ranges: HL[] = [];
      root.querySelectorAll<HTMLElement>("[data-pi]").forEach((el) => {
        if (!range.intersectsNode(el)) return;
        const len = (el.textContent ?? "").length;
        const s0 = el.contains(range.startContainer) ? offsetIn(el, range.startContainer, range.startOffset) : 0;
        const e0 = el.contains(range.endContainer) ? offsetIn(el, range.endContainer, range.endOffset) : len;
        if (e0 > s0) ranges.push({ p: Number(el.dataset.pi), s: s0, e: e0 });
      });
      const quote = sel.toString().replace(/\s+/g, " ").trim();
      if (!ranges.length || !quote) return;
      const rect = range.getBoundingClientRect();
      const first = passage.paras[ranges[0].p];
      setMenu({ x: rect.left + rect.width / 2, y: rect.bottom, ranges, quote: quote.slice(0, 400),
        letter: first !== undefined ? paraLetter(first) : undefined });
    };
    const onSel = () => { clearTimeout(t); t = setTimeout(read, 250); };
    const onClick = (e: MouseEvent) => {
      const m = (e.target as HTMLElement | null)?.closest?.("mark.pr-hl") as HTMLElement | null;
      const sel = window.getSelection();
      if (!m || (sel && !sel.isCollapsed)) return;
      const r = m.getBoundingClientRect();
      const idx = Number(m.dataset.hl);
      const h = studyRef.current?.hl[idx];
      const el = m.closest("[data-pi]") as HTMLElement | null;
      const quote = h && el ? (el.textContent ?? "").slice(h.s, h.e).replace(/\s+/g, " ").trim() : m.textContent ?? "";
      const para = h ? passage.paras[h.p] : undefined;
      setMenu({ x: r.left + r.width / 2, y: r.bottom, ranges: [], quote, hit: idx, note: h?.note,
        letter: para !== undefined ? paraLetter(para) : undefined });
    };
    // A scroll closes the menu, but not the one that happens as it opens.
    const hide = () => { if (Date.now() - opened.current > 400) setMenu(null); };
    document.addEventListener("selectionchange", onSel);
    root.addEventListener("click", onClick);
    window.addEventListener("scroll", hide, true);
    return () => {
      clearTimeout(t);
      document.removeEventListener("selectionchange", onSel);
      root.removeEventListener("click", onClick);
      window.removeEventListener("scroll", hide, true);
    };
  }, [passage, Boolean(study)]);

  useEffect(() => { if (menu) opened.current = Date.now(); }, [menu]);

  const act = (what: "hl" | "note" | "del" | "open") => {
    if (!menu || !study) return;
    if (what === "del" && menu.hit !== undefined) study.setHl((h) => h.filter((_, i) => i !== menu.hit));
    if (what === "hl") study.setHl((h) => [...h, ...menu.ranges]);
    if (what === "open" && menu.note) study.openNote(menu.note);
    if (what === "note") {
      // a note made from an existing highlight takes over that highlight
      if (menu.hit !== undefined) {
        const h = study.hl[menu.hit];
        study.setHl((all) => all.filter((_, i) => i !== menu.hit));
        study.addNote(menu.quote, menu.letter, h ? [{ p: h.p, s: h.s, e: h.e }] : []);
      } else study.addNote(menu.quote, menu.letter, menu.ranges);
    }
    window.getSelection()?.removeAllRanges();
    setMenu(null);
  };
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
      {drops?.showBank && (() => {
        const seen = new Set<string>();
        const banks = Object.values(drops.byLetter).filter((b) => {
          const k = JSON.stringify(b.bank[0]); if (seen.has(k)) return false; seen.add(k); return true;
        });
        return banks.map((b, bi) => {
          const ns = Object.values(drops.byLetter).filter((x) => x.bank === b.bank).map((x) => x.n);
          return (
            <HeadingBank key={bi} bank={b.bank} ns={ns} answers={drops.answers}
              held={drops.held} setHeld={drops.setHeld} sticky />
          );
        });
      })()}
      {passage.paras.map((p, i) => {
        const letter = typeof p === "object" ? p.l : undefined;
        const dropFor = drops ? drops.byLetter[paraLetter(p) ?? ""] : undefined;
        const text = typeof p === "object" ? p.t : p;
        // A "which paragraph contains…" answer is the paragraph itself, so the
        // whole thing is tinted rather than one line inside it.
        const owns = letter ? paraMarks?.[letter] : undefined;
        const box = dropFor && drops ? (
          <DropBox key={`d${i}`} n={dropFor.n} bank={dropFor.bank}
            ns={Object.values(drops.byLetter).filter((x) => x.bank === dropFor.bank).map((x) => x.n)}
            drops={drops} />
        ) : null;
        return [box, (
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
            <ParaText pi={study ? i : undefined} html={marked(text)} />
          </p>
        )];
      })}
      {menu && (
        <div className="pr-selmenu" role="menu"
          style={{ left: Math.min(Math.max(menu.x, 120), (typeof window !== "undefined" ? window.innerWidth : 400) - 120),
            top: menu.y + 10 }}
          onMouseDown={(e) => e.preventDefault()}>
          {menu.hit === undefined ? (
            <>
              <button type="button" onClick={() => act("hl")}>Highlight</button>
              <button type="button" onClick={() => act("note")}>Notes</button>
            </>
          ) : menu.note ? (
            <>
              <button type="button" onClick={() => act("open")}>Open note</button>
              <button type="button" onClick={() => act("del")}>Clear highlight</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => act("note")}>Notes</button>
              <button type="button" onClick={() => act("del")}>Clear highlight</button>
            </>
          )}
        </div>
      )}
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

/* ---- the dotted box above a paragraph, for "list of headings" ---- */
const DRAG_TYPE = "application/x-pec-heading";

type DropCtx = Pick<Drops, "answers" | "held" | "place" | "set">;

function DropBox({ n, bank, ns, drops, label }: {
  n: number; bank: [string, string][]; ns: number[]; drops: DropCtx;
  /** the question's own wording ("Paragraph C"), when the box is in the question list */
  label?: string;
}) {
  const [over, setOver] = useState(false);
  const v = drops.answers[String(n)];
  const r = typeof v === "string" ? v : "";
  const text = bank.find(([l]) => l.toLowerCase() === r)?.[1];
  const take = (roman: string) => drops.place(n, roman.toLowerCase(), ns);
  return (
    <div
      className={`pr-drop${over ? " over" : ""}${r ? " full" : ""}${drops.held ? " armed" : ""}${label ? " pr-drop-q" : ""}`}
      role="button" tabIndex={0}
      aria-label={r ? `Question ${n}: heading ${r} — ${text ?? ""}` : `Question ${n}: drop a heading here`}
      onDragOver={(e) => { if (e.dataTransfer.types.includes(DRAG_TYPE)) { e.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const x = e.dataTransfer.getData(DRAG_TYPE); if (x) take(x); }}
      onClick={() => { if (drops.held) take(drops.held); }}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && drops.held) { e.preventDefault(); take(drops.held); } }}
      draggable={Boolean(r)}
      onDragStart={(e) => { if (r) { e.dataTransfer.setData(DRAG_TYPE, r); e.dataTransfer.effectAllowed = "move"; } }}
    >
      <span className="pr-drop-n">{n}</span>
      {label && <span className="pr-drop-l" dangerouslySetInnerHTML={{ __html: label }} />}
      {r ? (
        <>
          <span className="pr-drop-t"><b>{r}</b> {text}</span>
          <button type="button" className="pr-drop-x" aria-label={`Remove heading from question ${n}`}
            onClick={(e) => { e.stopPropagation(); drops.set(n, ""); }}>✕</button>
        </>
      ) : (
        <span className="pr-drop-t pr-drop-hint">
          {drops.held ? <>Tap to place heading <b>{drops.held}</b> here</> : label ? "Drag a heading here or onto the passage" : "Drag a heading here"}
        </span>
      )}
    </div>
  );
}

/* ---- the list of headings, as cards that can be dragged or tapped ---- */
function HeadingBank({
  bank, title, ns, answers, held, setHeld, sticky = false,
}: {
  bank: [string, string][]; title?: string; ns: number[]; answers: Answers;
  held: string | null; setHeld: (r: string | null) => void; sticky?: boolean;
}) {
  const usedOn = (r: string) => ns.find((m) => answers[String(m)] === r);
  return (
    <div className={`pr-hbank${sticky ? " sticky" : ""}`}>
      <b className="pr-hbank-title">{title ?? "List of Headings"}</b>
      <span className="pr-hbank-help">Drag a heading onto the dotted box above its paragraph — or tap a heading, then tap the box.</span>
      {bank.map(([l, t]) => {
        const r = l.toLowerCase();
        const used = usedOn(r);
        return (
          <button key={l} type="button" draggable
            className={`pr-hchip${held === r ? " held" : ""}${used ? " used" : ""}`}
            aria-pressed={held === r}
            onDragStart={(e) => { e.dataTransfer.setData(DRAG_TYPE, r); e.dataTransfer.effectAllowed = "move"; }}
            onClick={() => setHeld(held === r ? null : r)}>
            <b>{l}</b> <span>{t}</span>
            {used && <em>Q{used}</em>}
          </button>
        );
      })}
    </div>
  );
}

/* ================= a group of questions ================= */
function GroupBlock({
  group, answers, set, media, cover, wide = false, drag,
}: {
  group: Group; answers: Answers; cover?: Record<number, number[]>;
  /** a "list of headings" task with boxes in the passage: the bank is draggable */
  drag?: { ns: number[]; held: string | null; setHeld: (r: string | null) => void;
    place: (n: number, r: string, ns: number[]) => void };
  set: (n: number | string, v: string | string[]) => void;
  media: Record<string, string>;
  /** The questions have the width of the page (listening, or reading in
   *  Questions view), so a map or plan can sit beside them. */
  wide?: boolean;
}) {
  const figure = group.img && media[group.img] ? (
    <figure style={{ textAlign: "center", margin: "0 0 14px" }}>
      <img src={media[group.img]} alt={group.imgCap ?? ""} style={{ maxWidth: "100%", borderRadius: 10 }} />
      {group.imgCap && (
        <figcaption style={{ fontSize: "0.78rem", color: "var(--grey)", marginTop: 6 }}>{group.imgCap}</figcaption>
      )}
    </figure>
  ) : null;
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
      {group.bank && drag && (
        <HeadingBank bank={group.bank} title={group.bankTitle} ns={drag.ns} answers={answers}
          held={drag.held} setHeld={drag.setHeld} />
      )}
      {group.bank && !drag && (
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
      {/* A map, plan or diagram: on a wide screen it sits on the left and stays
          in view while the student works down the questions on the right, so
          the labels and the answer boxes can be read together. */}
      {figure && wide ? (
        <div className="pr-figsplit">
          {figure}
          <div className="pr-figbody">{groupBody()}</div>
        </div>
      ) : (
        <>
          {figure}
          {groupBody()}
        </>
      )}
    </section>
  );

  function groupBody() {
    return (
      <>
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

      {/* A heading task: no i / ii / iii buttons, just each question and the
          heading chosen for it — the headings go into the boxes in the passage,
          and these rows take a heading too (Questions view hides the passage). */}
      {drag && group.bank ? group.questions?.map((q) => (
        <DropBox key={q.n} n={q.n} bank={group.bank!} ns={drag.ns} label={q.stem}
          drops={{ answers, set, held: drag.held, place: drag.place }} />
      )) : group.questions?.map((q) => (
        <QuestionBlock key={q.n} q={q} group={group} answers={answers} set={set} media={media}
          covers={cover?.[q.n] ?? [q.n]} wide={wide} />
      ))}
      </>
    );
  }
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
  q, group, answers, set, media, covers = [q.n], wide = false,
}: {
  q: Question; group: Group; answers: Answers; covers?: number[]; wide?: boolean;
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

  const qFigure = q.img && media[q.img] ? (
    <figure style={{ textAlign: "center", margin: "12px 0" }}>
      <img src={media[q.img]} alt={q.imgCap ?? ""} style={{ maxWidth: "100%", borderRadius: 10 }} />
      {q.imgCap && (
        <figcaption style={{ fontSize: "0.78rem", color: "var(--grey)", marginTop: 6 }}>{q.imgCap}</figcaption>
      )}
    </figure>
  ) : null;

  const choices = (
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
  );

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

      {/* A question asked about a picture (which chart, which plan): on a wide
          screen the picture and the choices sit side by side. */}
      {qFigure && wide ? (
        <div className="pr-figsplit pr-figq">
          {qFigure}
          <div>{choices}</div>
        </div>
      ) : (
        <>
          {qFigure}
          {choices}
        </>
      )}

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
        <ReviewPanel test={test} questions={result.questions} Passage={Passage} transcript={result.transcript} />
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
