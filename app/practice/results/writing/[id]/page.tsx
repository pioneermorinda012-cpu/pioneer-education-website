import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { requireStudent } from "@/lib/guard";
import { readSession, TEACHER_COOKIE } from "@/lib/session";
import { writingById, writingsReady } from "@/lib/writings";
import MarkedText, { MarkNotes } from "@/components/practice/MarkedText";

export const dynamic = "force-dynamic";

const KIND: Record<string, string> = {
  task1: "Writing Task 1 · Academic", gt1: "Writing Task 1 · GT letter", task2: "Writing Task 2",
};
const fmt = (s: number | null) => (s == null ? "—" : `${Math.floor(s / 60)} min`);

/* One piece of the student's writing, as the teacher marked it. */
export default async function MyWritingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireStudent(`/practice/results/writing/${id}`);
  if (!writingsReady()) notFound();
  const w = await writingById(id).catch(() => null);
  if (!w) notFound();

  // a student opens only their own; the teacher opens anyone's
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const teacher = secret ? await readSession((await cookies()).get(TEACHER_COOKIE)?.value, secret) : null;
  if (w.student_id !== me.sid && teacher?.role !== "teacher") notFound();

  const checked = w.status === "checked";
  // marking still in progress is the teacher's draft, not something to show yet
  const marks = checked ? w.marks : [];
  const errs = marks.filter((m) => m.kind === "err").length;
  const c = w.criteria ?? {};
  return (
    <div className="wrap">
      <Link href="/practice/results#writing" style={{ display: "inline-block", marginTop: 20, fontWeight: 700 }}>
        ← My results
      </Link>
      <div className="pr-head wm-head">
        <h1>{KIND[w.kind] ?? "Writing"}</h1>
        <span className={"wm-status" + (checked ? " checked" : "")}>
          {checked ? "Checked by your teacher" : "Waiting for your teacher"}
        </span>
      </div>
      <div className="wm-q">{w.question}</div>

      {checked && (
        <section className="pr-set">
          <h2>Your teacher&apos;s marks</h2>
          <div className="wm-bands">
            <div className="main"><label>Band</label><div className="v">{w.teacher_band != null ? Number(w.teacher_band).toFixed(1) : "—"}</div></div>
            <div><label>{w.kind === "task2" ? "Task Response" : "Task Achievement"}</label><div className="v">{c.ta ?? "—"}</div></div>
            <div><label>Coherence &amp; Cohesion</label><div className="v">{c.cc ?? "—"}</div></div>
            <div><label>Vocabulary</label><div className="v">{c.lr ?? "—"}</div></div>
            <div><label>Grammar</label><div className="v">{c.gra ?? "—"}</div></div>
          </div>
          {w.teacher_note && <div className="wm-q" style={{ borderLeftColor: "#2e7d4f" }}>{w.teacher_note}</div>}
        </section>
      )}

      <section className="pr-set">
        <h2>
          What you wrote · {w.words} words · {fmt(w.seconds_used)}
          {checked && errs > 0 && <> · <span style={{ color: "#d32f2f" }}>{errs} mistake{errs === 1 ? "" : "s"} underlined</span></>}
        </h2>
        <MarkedText body={w.body} marks={marks} />
        <MarkNotes body={w.body} marks={marks} />
        {!checked && (
          <p className="pr-note">Your teacher has not checked this yet. Come back later — the mistakes will be underlined in red.</p>
        )}
      </section>
    </div>
  );
}
