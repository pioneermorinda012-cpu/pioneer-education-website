"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MarkedText, { MarkNotes, type PenMark } from "./MarkedText";

/* The teacher's red pen.
 *
 * Select a word or phrase in the student's writing (drag with the mouse, or
 * press and drag on a phone) and it is underlined in the pen's colour: red
 * for a mistake, green for something done well. Tap a mark to write a note on
 * it, switch its colour or remove it. The marks are kept as character
 * positions in the student's text, so the text itself is never changed. */

type W = {
  id: string; kind: string; question: string; body: string; words: number;
  seconds_used: number | null; auto_band: number | null; status: string;
  marks: PenMark[]; teacher_band: number | null;
  criteria: { ta?: number | null; cc?: number | null; lr?: number | null; gra?: number | null } | null;
  teacher_note: string | null; submitted_at: string;
  students?: { full_name?: string; code?: string; batch?: string | null } | null;
};

const KIND: Record<string, string> = {
  task1: "Academic Task 1", gt1: "GT Task 1 letter", task2: "Task 2 essay",
};
const isWord = (ch: string) => /[\p{L}\p{N}'’-]/u.test(ch);

export default function WritingMarker({ id }: { id: string }) {
  const [w, setW] = useState<W | null>(null);
  const [state, setState] = useState<"loading" | "locked" | "missing" | "in">("loading");
  const [err, setErr] = useState("");
  const [marks, setMarks] = useState<PenMark[]>([]);
  const [pen, setPen] = useState<"err" | "good">("err");
  const [active, setActive] = useState<number | null>(null);
  const [bands, setBands] = useState({ overall: "", ta: "", cc: "", lr: "", gra: "" });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/practice/teacher?writing=${encodeURIComponent(id)}`, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!d.authed) { setState("locked"); return; }
      if (!d.writing) { setErr(d.error || ""); setState("missing"); return; }
      const x = d.writing as W;
      setW(x);
      setMarks(x.marks ?? []);
      const c = x.criteria ?? {};
      const v = (n: number | null | undefined) => (n == null ? "" : String(n));
      setBands({ overall: v(x.teacher_band), ta: v(c.ta), cc: v(c.cc), lr: v(c.lr), gra: v(c.gra) });
      setNote(x.teacher_note ?? "");
      setState("in");
    })();
  }, [id]);

  /* Where a selection starts and ends, as positions in the student's text. */
  const addFromSelection = useCallback(() => {
    if (!w || !box.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const r = sel.getRangeAt(0);
    if (!box.current.contains(r.startContainer) || !box.current.contains(r.endContainer)) return;
    const pos = (node: Node, off: number) => {
      const pre = document.createRange();
      pre.setStart(box.current!, 0);
      pre.setEnd(node, off);
      return pre.toString().length;
    };
    let s = pos(r.startContainer, r.startOffset), e = pos(r.endContainer, r.endOffset);
    const t = w.body;
    // a finger never lands exactly on a word's edge, so take whole words
    while (s > 0 && isWord(t[s - 1]) && isWord(t[s])) s--;
    while (e < t.length && isWord(t[e - 1]) && isWord(t[e])) e++;
    while (s < e && /\s/.test(t[s])) s++;
    while (e > s && /\s/.test(t[e - 1])) e--;
    sel.removeAllRanges();
    if (e <= s) return;
    const kept = marks.filter((m) => m.e <= s || m.s >= e);   // a new mark replaces any it overlaps
    const next = [...kept, { s, e, kind: pen }].sort((a, b) => a.s - b.s);
    setMarks(next);
    setActive(next.findIndex((m) => m.s === s));
    setMsg("");
  }, [w, marks, pen]);

  const update = (i: number, patch: Partial<PenMark>) =>
    setMarks((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const remove = (i: number) => { setMarks((ms) => ms.filter((_, j) => j !== i)); setActive(null); };

  async function save(done: boolean) {
    if (!w) return;
    setBusy(true); setErr(""); setMsg("");
    const r = await fetch("/api/practice/teacher", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "markWriting", id: w.id, marks, teacher_band: bands.overall,
        criteria: { ta: bands.ta, cc: bands.cc, lr: bands.lr, gra: bands.gra },
        teacher_note: note, done,
      }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(d.error || "Could not save."); return; }
    setW({ ...w, status: done ? "checked" : "submitted" });
    setMsg(done ? "Sent — the student can see your marks now." : "Draft saved. The student does not see it until you send it.");
  }

  if (state === "loading") return <p className="lede">Loading…</p>;
  if (state === "locked") {
    return (
      <div className="pr-signin">
        <h1>Teacher area</h1>
        <p className="lede">Sign in on the teacher page first, then open this writing again.</p>
        <a className="btn" href="/practice/teacher">Teacher sign in</a>
      </div>
    );
  }
  if (state === "missing" || !w) return <div className="pr-err">{err || "That writing is not there any more."}</div>;

  const a = active != null ? marks[active] : null;
  const errs = marks.filter((m) => m.kind === "err").length;
  const goods = marks.length - errs;
  const crit = w.kind === "task2" ? "Task Response" : "Task Achievement";

  return (
    <>
      <div className="pr-head wm-head">
        <h1>{w.students?.full_name ?? "Student"} · {KIND[w.kind] ?? "Writing"}</h1>
        <span className={"wm-status" + (w.status === "checked" ? " checked" : "")}>
          {w.status === "checked" ? "Checked" : "To check"}
        </span>
      </div>
      <p className="pr-note" style={{ marginTop: 0 }}>
        {w.students?.code}{w.students?.batch ? ` · ${w.students.batch}` : ""} · {new Date(w.submitted_at).toLocaleString()} ·
        {" "}{w.words} words{w.seconds_used != null ? ` · ${Math.round(w.seconds_used / 60)} min` : ""}
        {w.auto_band != null ? ` · instant check said ${Number(w.auto_band).toFixed(1)}` : ""}
      </p>
      <div className="wm-q">{w.question}</div>

      <div className="wm-tray">
        <button type="button" className={"wm-pen err" + (pen === "err" ? " sel" : "")} onClick={() => setPen("err")}>
          ✎ Red pen — mistake
        </button>
        <button type="button" className={"wm-pen good" + (pen === "good" ? " sel" : "")} onClick={() => setPen("good")}>
          ✎ Green pen — good
        </button>
        {/* On a phone the selection handles are still moving when the finger
            lifts, so the selection is applied with this button instead. */}
        <button type="button" className="btn ghost" onMouseDown={(e) => e.preventDefault()} onClick={addFromSelection}>
          Underline selected
        </button>
        <span className="hint">Select words to underline them · tap a mark to add a note or remove it</span>
        <span className="grow" style={{ flex: 1 }} />
        <span className="hint"><b style={{ color: "#d32f2f" }}>{errs}</b> mistakes · <b style={{ color: "#2e7d4f" }}>{goods}</b> good</span>
      </div>

      <div onMouseUp={addFromSelection}>
        <MarkedText body={w.body} marks={marks} boxRef={box} active={active}
          onMarkClick={(i) => setActive(i === active ? null : i)} />
      </div>

      {a && active != null && (
        <div className="wm-edit">
          <b style={{ color: a.kind === "err" ? "#d32f2f" : "#2e7d4f" }}>{active + 1}.</b>
          <span style={{ fontStyle: "italic" }}>“{w.body.slice(a.s, a.e).slice(0, 60)}”</span>
          <input value={a.note ?? ""} autoFocus placeholder={a.kind === "err" ? "Correction or note, e.g. “have went” → “have gone”" : "What is good about it"}
            onChange={(e) => update(active, { note: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") setActive(null); }} />
          <button type="button" className="btn ghost" onClick={() => update(active, { kind: a.kind === "err" ? "good" : "err" })}>
            Make it {a.kind === "err" ? "green" : "red"}
          </button>
          <button type="button" className="btn ghost" onClick={() => remove(active)}>Remove</button>
          <button type="button" className="btn ghost" onClick={() => setActive(null)}>Done</button>
        </div>
      )}

      <MarkNotes body={w.body} marks={marks} />

      <section className="pr-set">
        <h2>Band and comment</h2>
        <div className="wm-bands">
          {([["overall", "Band"], ["ta", crit], ["cc", "Coherence & Cohesion"], ["lr", "Vocabulary"], ["gra", "Grammar"]] as const).map(([k, label]) => (
            <div key={k} className={k === "overall" ? "main" : ""}>
              <label htmlFor={`b-${k}`}>{label}</label>
              <input id={`b-${k}`} inputMode="decimal" placeholder="—" value={bands[k]}
                onChange={(e) => setBands({ ...bands, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 3) })} />
            </div>
          ))}
        </div>
        <label htmlFor="t-note" style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>Comment for the student</label>
        <textarea id="t-note" className="wm-comment" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="What to work on next…" />
        {err && <div className="pr-err">{err}</div>}
        {msg && <p className="wr-savednote ok">{msg}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          <button type="button" className="btn btn-coral" disabled={busy} onClick={() => save(true)}>
            {busy ? "Saving…" : w.status === "checked" ? "Save changes (student sees them)" : "Send marks to the student"}
          </button>
          {w.status !== "checked" && (
            <button type="button" className="btn btn-outline" disabled={busy} onClick={() => save(false)}>Save draft</button>
          )}
          <a className="btn ghost" href="/practice/teacher">← Back to the list</a>
        </div>
      </section>
    </>
  );
}
