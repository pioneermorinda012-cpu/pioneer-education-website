import Link from "next/link";
import type { Writing } from "@/lib/writings";

const KIND: Record<string, string> = {
  task1: "Academic Task 1", gt1: "GT Task 1 letter", task2: "Task 2 essay",
};

/* The student's saved writing, newest first, with whether the teacher has
 * checked it yet. */
export default function MyWriting({ items, title = "My writing", empty, hideQuestion }: {
  items: Writing[]; title?: string; empty?: string; hideQuestion?: boolean;
}) {
  return (
    <section className="pr-set" id="writing">
      <h2>{title}</h2>
      {!items.length ? (
        <div className="pr-note">
          {empty ?? "Finish a writing task and it is saved here for your teacher to check. Once it is checked you see your mistakes underlined in red."}
        </div>
      ) : (
        <div className="pr-rows">
          {items.map((w) => (
            <div className="pr-row" key={w.id}>
              <div>
                <div className="nm">
                  {hideQuestion
                    ? `${new Date(w.submitted_at).toLocaleString()}`
                    : <>{KIND[w.kind] ?? "Writing"} · {w.question.split("\n")[0].slice(0, 90)}{w.question.length > 90 ? "…" : ""}</>}
                </div>
                <div className="fx">
                  {!hideQuestion && <span>{new Date(w.submitted_at).toLocaleDateString()}</span>}
                  <span>{w.words} words</span>
                  <span className={"wm-status" + (w.status === "checked" ? " checked" : "")}>
                    {w.status === "checked" ? "Checked" : "Waiting for teacher"}
                  </span>
                </div>
              </div>
              <Link className="btn btn-outline" href={`/practice/results/writing/${w.id}`}
                style={{ padding: "7px 13px", fontSize: "0.8rem", minHeight: 38 }}>
                Open
              </Link>
              {w.status === "checked" && w.teacher_band != null ? (
                <span className={"pr-band " + (Number(w.teacher_band) >= 7 ? "hi" : Number(w.teacher_band) >= 5.5 ? "mid" : "lo")}>
                  <span className="lb">band</span>{Number(w.teacher_band).toFixed(1)}
                </span>
              ) : (
                <span className="pr-band none">—</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
