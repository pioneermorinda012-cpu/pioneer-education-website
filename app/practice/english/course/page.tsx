import { requireStudent } from "@/lib/guard";
import PracticeNav from "@/components/practice/PracticeNav";
import CourseMap from "@/components/practice/CourseMap";
import { COURSE, COURSE_KEY, COURSE_LESSONS, COURSE_TRAINER, type CourseProgress } from "@/lib/english-course";
import { getProgress, progressReady } from "@/lib/progress";

export const dynamic = "force-dynamic";

/* The English Grammar & Vocabulary course: every lesson in learning order,
 * ticked off as the student finishes it (lib/english-course.ts). */
export default async function EnglishCourse() {
  const session = await requireStudent("/practice/english/course", ["english"]);

  let progress: CourseProgress = {};
  if (session.role === "student" && progressReady()) {
    try {
      const saved = await getProgress(session.sid, COURSE_TRAINER);
      const raw = saved?.data[COURSE_KEY];
      if (raw) progress = JSON.parse(raw) as CourseProgress;
    } catch { /* progress is a nicety; the course still opens */ }
  }

  return (
    <div className="wrap">
      <PracticeNav active="ENGLISH" session={session} />
      <div className="pr-head">
        <h1>English Grammar &amp; Vocabulary</h1>
        <span className="meta">{COURSE_LESSONS.length} lessons · {COURSE.length} stages · A1 to B2</span>
      </div>
      <div className="pr-note">
        Work through the stages in order. Each lesson has a <b>Learn</b> part and a <b>Practice</b> part that checks every answer.
        Answer all the questions to finish a lesson; your progress is saved to your account. Use <b>Next</b> at the bottom of each lesson to move on.
      </div>
      <CourseMap initial={progress} />
    </div>
  );
}
