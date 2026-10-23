import Link from "next/link";
import { requireStudent } from "@/lib/guard";
import { LESSONS, youTubeId } from "@/lib/learn";
import { getWriting } from "@/lib/writing";
import PracticeNav from "@/components/practice/PracticeNav";

export const dynamic = "force-dynamic";

/* Learn first, then practise: one card per Task 1 chart type, with its video,
 * its lesson (language, examples, exercises, model answers) and a link
 * straight to the practice tasks of that type. */
export default async function LearnTask1() {
  const session = await requireStudent("/practice/learn", ["academic"]);
  const all = await getWriting();
  const count = (type: string) => all.filter((t) => t.kind === "task1" && t.chartType === type).length;

  return (
    <div className="wrap">
      <PracticeNav active="LEARN" session={session} />

      <div className="pr-head">
        <h1>Learn Writing Task 1</h1>
        <span className="meta">Academic · 6 chart types</span>
      </div>

      <div className="pr-note">
        <b>For each chart type: watch the video, read the lesson, then practise.</b> The lessons have the
        words and grammar you need, short exercises that check your answers, and model answers.
      </div>

      <section className="ln-plan">
        <h2>Every Task 1 answer has 4 parts</h2>
        <ol>
          <li><b>Introduction</b> — say what the chart shows, in your own words.</li>
          <li><b>Overview</b> — the main features: biggest, smallest, overall trend.</li>
          <li><b>Body 1</b> — details and numbers for one group of features.</li>
          <li><b>Body 2</b> — details and numbers for the rest.</li>
        </ol>
        <p>About 20 minutes, at least 150 words. Report what the chart shows — no opinions and no reasons.</p>
      </section>

      <div className="ln-grid">
        {LESSONS.map((l, i) => {
          const id = youTubeId(l.video);
          const n = count(l.chartType);
          return (
            <section className="ln-card" key={l.id} id={l.id}>
              <div className="ln-step">Lesson {i + 1}</div>
              <h2>{l.title}</h2>
              <p>{l.blurb}</p>
              {id ? (
                <div className="ln-frame">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
                    title={`${l.title} — video lesson`}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a className="btn btn-outline" href={l.video} target="_blank" rel="noopener noreferrer">▶ Watch the video</a>
              )}
              <div className="ln-go">
                <Link className="btn btn-coral" href={`/practice/learn/${l.id}`} prefetch={false}>
                  Open the lesson
                </Link>
                {n > 0 && (
                  <Link className="btn btn-outline" href={`/practice/writing?task=1&type=${encodeURIComponent(l.chartType)}`}>
                    Practise · {n} {n === 1 ? "task" : "tasks"}
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
