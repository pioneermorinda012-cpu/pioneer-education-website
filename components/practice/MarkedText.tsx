/* A student's writing with the teacher's pen marks on it: red underline for a
 * mistake, green for something done well, each numbered to its note.
 *
 * Shared by the student's view and the teacher's marking page. The numbers are
 * drawn with CSS (::after), not as text, so the text inside the box stays
 * exactly the student's — the marking page counts characters in it to know
 * where a new mark starts and ends. */
import type { Ref } from "react";

export type PenMark = { s: number; e: number; kind: "err" | "good"; note?: string };

export default function MarkedText({ body, marks, onMarkClick, boxRef, active }: {
  body: string;
  marks: PenMark[];
  onMarkClick?: (i: number) => void;
  boxRef?: Ref<HTMLDivElement>;
  active?: number | null;
}) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  marks.forEach((m, i) => {
    if (m.s > at) parts.push(body.slice(at, m.s));
    parts.push(
      <span
        key={i}
        className={"wm " + (m.kind === "good" ? "good" : "err") + (active === i ? " on" : "")}
        data-n={i + 1}
        title={m.note || (m.kind === "good" ? "Well done" : "Mistake")}
        onClick={onMarkClick ? (e) => { e.stopPropagation(); onMarkClick(i); } : undefined}
      >
        {body.slice(m.s, m.e)}
      </span>,
    );
    at = m.e;
  });
  if (at < body.length) parts.push(body.slice(at));
  return <div className="wm-text" ref={boxRef}>{parts}</div>;
}

/** The numbered notes under the writing. */
export function MarkNotes({ body, marks }: { body: string; marks: PenMark[] }) {
  if (!marks.length) return null;
  return (
    <ol className="wm-notes">
      {marks.map((m, i) => (
        <li key={i} className={m.kind === "good" ? "good" : "err"} value={i + 1}>
          <span className="q">“{body.slice(m.s, m.e).trim().slice(0, 80)}”</span>
          {m.note ? <> — {m.note}</> : m.kind === "good" ? " — well done" : " — check this"}
        </li>
      ))}
    </ol>
  );
}
