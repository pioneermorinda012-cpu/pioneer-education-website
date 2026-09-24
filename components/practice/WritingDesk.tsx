"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { score, type Score } from "@/lib/writing-score";
import type { WritingTask } from "@/lib/writing";

/**
 * Where a student actually writes.
 *
 * The clock is the point. A student who can write 250 good words in an hour and
 * cannot write them in forty does not have a writing problem, they have a
 * timing problem, and the only way to find that out is to be timed. So the
 * timer starts on the first keystroke rather than on page load — no penalty for
 * reading the question properly — and it never locks the box when it runs out.
 * Being cut off mid-sentence teaches nothing; seeing "you were 80 words short
 * when the time went" teaches the whole lesson.
 *
 * The draft is saved as it is typed. A student on a phone who takes a call
 * forty minutes into an essay should not lose it.
 */

const fmt = (s: number) =>
  `${Math.floor(Math.abs(s) / 60)}:${String(Math.abs(s) % 60).padStart(2, "0")}`;

export default function WritingDesk({ task }: { task: WritingTask }) {
  const store = `pec_writing_${task.id}`;
  const [chosen, setChosen] = useState(0);
  const [text, setText] = useState("");
  const [left, setLeft] = useState(task.minutes * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<Score | null>(null);
  const [showIdeas, setShowIdeas] = useState(false);
  const [elapsedAtFinish, setElapsedAtFinish] = useState(0);
  const box = useRef<HTMLTextAreaElement>(null);

  /* bring back an unfinished draft */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(store);
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.text === "string") setText(d.text);
        if (typeof d.left === "number") setLeft(d.left);
        if (typeof d.chosen === "number") setChosen(d.chosen);
      }
    } catch { /* a blocked store is not a reason to fail */ }
  }, [store]);

  useEffect(() => {
    try { window.localStorage.setItem(store, JSON.stringify({ text, left, chosen })); }
    catch { /* nothing to do */ }
  }, [store, text, left, chosen]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const live = useMemo(() => (text.trim().match(/[A-Za-z']+/g) ?? []).length, [text]);
  const short = live < task.minWords;

  const finish = useCallback(() => {
    setRunning(false);
    setElapsedAtFinish(task.minutes * 60 - left);
    setDone(score(text, task.minWords, task.kind));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [text, task, left]);

  const restart = () => {
    setDone(null); setText(""); setLeft(task.minutes * 60); setRunning(false);
    try { window.localStorage.removeItem(store); } catch { /* fine */ }
    box.current?.focus();
  };

  const prompt = task.prompts?.[chosen];

  return (
    <div className="wr-desk">
      {/* ---------------------------------------------------------- question */}
      <section className="pr-set">
        <div className="wr-head">
          <div>
            <span className="wr-kind">{task.kind === "task1" ? "Writing Task 1 · Academic" : task.kind === "gt1" ? `Writing Task 1 · GT letter${task.register ? ` · ${task.register}` : ""}` : "Writing Task 2"}</span>
            <h1>{task.title}</h1>
          </div>
          <span className={"wr-clock" + (left < 0 ? " over" : left < 300 ? " low" : "")}>
            {left < 0 ? "+" : ""}{fmt(left)}
            <small>{running ? "writing" : done ? "finished" : "starts when you type"}</small>
          </span>
        </div>

        {task.images?.length ? (
          <div className="wr-figs">
            {task.images.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={`/practice/writing/${src}`} alt="The chart for this task" />
            ))}
          </div>
        ) : null}

        {task.prompts && task.prompts.length > 1 && (
          <div className="wr-pick">
            {task.prompts.map((_, i) => (
              <button key={i} type="button"
                className={"wr-tab" + (i === chosen ? " on" : "")}
                onClick={() => setChosen(i)} disabled={running || !!done}>
                Question {i + 1}
              </button>
            ))}
          </div>
        )}

        {prompt && <blockquote className="wr-prompt">{prompt}</blockquote>}

        <p className="wr-rule">
          You should spend about <b>{task.minutes} minutes</b> on this task and write at
          least <b>{task.minWords} words</b>.
        </p>

        {task.links?.length ? (
          <p className="wr-links">
            {task.links.map((u, i) => (
              <a key={u} href={u} target="_blank" rel="noopener noreferrer">
                {/youtu\.?be/i.test(u) ? "▶ Watch the lesson" : `Read more${task.links!.length > 1 ? ` (${i + 1})` : ""}`}
              </a>
            ))}
          </p>
        ) : null}

        {task.ideas?.length ? (
          <div className="wr-ideas">
            <button type="button" className="wr-ideas-go" onClick={() => setShowIdeas((v) => !v)}>
              {showIdeas ? "Hide the idea list" : `Stuck? ${task.ideas.length} ideas for this topic`}
            </button>
            {showIdeas && (
              <>
                <p className="wr-ideas-warn">
                  These are prompts for your own thinking, not sentences to copy. An
                  examiner has read them before.
                </p>
                <ul>{task.ideas.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </>
            )}
          </div>
        ) : null}
      </section>

      {/* ---------------------------------------------------------- feedback */}
      {done && (
        <section className="pr-set wr-report">
          <h2>Your writing, checked</h2>
          <div className="wr-tiles">
            <div className="wr-tile"><span className="v">{done.words}</span><span className="k">words</span></div>
            <div className="wr-tile"><span className="v">{done.paragraphs}</span><span className="k">paragraphs</span></div>
            <div className="wr-tile"><span className="v">{done.avgSentence}</span><span className="k">words per sentence</span></div>
            <div className="wr-tile"><span className="v">{fmt(elapsedAtFinish)}</span><span className="k">time taken</span></div>
          </div>

          <div className="wr-est">
            <b>Rough guide: band {done.estimate.toFixed(1)}</b>
            <span>
              This counts length, structure, linking and vocabulary range. It cannot read
              your argument, so it is a starting point for your teacher, never a result.
            </span>
          </div>

          <ul className="wr-notes">
            {done.notes.map((n, i) => (
              <li key={i} className={n.kind}>
                <span className="mk">{n.kind === "good" ? "✓" : "→"}</span>{n.text}
              </li>
            ))}
          </ul>

          <div className="wr-acts">
            <button type="button" className="btn btn-coral" onClick={restart}>Write it again</button>
            <Link className="btn btn-outline" href="/practice/writing">Back to the list</Link>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- write */}
      <section className="pr-set">
        <div className="wr-bar">
          <span className={"wr-count" + (short ? " short" : " ok")}>
            {live} / {task.minWords} words
          </span>
          {left < 0 && !done && (
            <span className="wr-overtime">over time — finish the sentence and stop</span>
          )}
          <span className="grow" />
          <button type="button" className="btn btn-coral" onClick={finish} disabled={!text.trim()}>
            {done ? "Check again" : "I have finished"}
          </button>
        </div>

        <textarea
          ref={box}
          className="wr-box"
          value={text}
          placeholder="Write your answer here. Leave a blank line between paragraphs."
          onChange={(e) => { setText(e.target.value); if (!running && !done) setRunning(true); }}
          spellCheck={false}
          rows={18}
        />
        <p className="wr-saved">
          Saved on this device as you type — you can close this and come back.
          Spell-check is off, exactly as in the real test.
        </p>
      </section>
    </div>
  );
}
