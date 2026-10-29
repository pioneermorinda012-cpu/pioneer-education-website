"use client";

import { useEffect, useState } from "react";
import { COURSE, COURSE_KEY, COURSE_LESSONS, VIDEOS, type CourseProgress } from "@/lib/english-course";

/* The English course, stage by stage, with each lesson ticked off. Progress
 * comes from the student's account (handed in by the page) and from this
 * browser, whichever is further on — so a lesson just finished shows straight
 * away, even before its save has reached the server. */

const merge = (a: CourseProgress, b: CourseProgress): CourseProgress => {
  const out: CourseProgress = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const c = out[k];
    out[k] = c ? { s: Math.max(c.s, v.s), d: Math.max(c.d, v.d), t: v.t || c.t } : v;
  }
  return out;
};
const done = (p?: { d: number; t: number }) => !!p && p.t > 0 && p.d >= p.t;

export default function CourseMap({ initial }: { initial: CourseProgress }) {
  const [prog, setProg] = useState<CourseProgress>(initial);

  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem(COURSE_KEY) || "{}") as CourseProgress;
      if (local && typeof local === "object") setProg((p) => merge(p, local));
    } catch { /* private mode: the account copy is enough */ }
  }, []);

  const total = COURSE_LESSONS.length;
  const finished = COURSE_LESSONS.filter((l) => done(prog[l.id])).length;
  const nextUp = COURSE_LESSONS.find((l) => !done(prog[l.id]));

  return (
    <>
      <div className="cm-top">
        <div className="cm-bar" aria-hidden><span style={{ width: `${(finished / total) * 100}%` }} /></div>
        <div className="cm-count"><b>{finished}</b> of {total} lessons finished</div>
        {nextUp && (
          <a className="btn btn-coral" href={`/practice/english/course/${nextUp.id}`}>
            {finished || prog[nextUp.id] ? "Continue" : "Start"}: {nextUp.title} →
          </a>
        )}
      </div>

      {COURSE.map((st) => {
        const ls = st.units.flatMap((u) => u.lessons);
        const sd = ls.filter((l) => done(prog[l.id])).length;
        return (
          <section className="cm-stage" key={st.title}>
            <h2>{st.title} <span className="cm-lvl">{st.level}</span> <span className="cm-sd">{sd}/{ls.length}</span></h2>
            <div className="cm-units">
              {st.units.map((u) => (
                <div className="cm-unit" key={u.key} id={u.key}>
                  <h3>{u.title}</h3>
                  <ol>
                    {u.lessons.map((l) => {
                      const p = prog[l.id];
                      const ok = done(p);
                      return (
                        <li key={l.id} className={ok ? "ok" : p ? "go" : undefined}>
                          <a href={`/practice/english/course/${l.id}`}>
                            <span className="cm-tick" aria-hidden>{ok ? "✓" : p ? "•" : ""}</span>
                            <span className="cm-t">{l.title}{l.test && <em> · Test</em>}{VIDEOS[l.id] && <span className="cm-v" title="Has a video"> ▶</span>}</span>
                            <span className="cm-s">{p && p.d > 0 ? `${p.s}/${p.t}` : `${l.questions} Qs`}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
