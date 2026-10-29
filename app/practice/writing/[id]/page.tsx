import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import WritingDesk from "@/components/practice/WritingDesk";
import Link from "next/link";
import { lessonForType, TASK2_STRUCTURE_VIDEO } from "@/lib/learn";
import VideoNote from "@/components/practice/VideoNote";
import TopicVocab from "@/components/practice/TopicVocab";
import { getWritingTask, forStudent, topicVocab } from "@/lib/writing";
import { requireStudent } from "@/lib/guard";
import { allows, WRITING_AREAS } from "@/lib/access";
import { redirect } from "next/navigation";
import { readSession, TEACHER_COOKIE } from "@/lib/session";
import { writingsForStudentTask, writingsReady, type Writing } from "@/lib/writings";
import MyWriting from "@/components/practice/MyWriting";

export const dynamic = "force-dynamic";

export default async function WritingTaskPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
  const me = await requireStudent(`/practice/writing/${id}`);

  const task = await getWritingTask(id);
  if (!task) notFound();
  if (!allows(me, WRITING_AREAS[task.kind])) {
    redirect(`/practice/locked?from=${encodeURIComponent(`/practice/writing/${id}`)}`);
  }

  /* The model answer is a teacher's tool. It is decided here, on the server,
     and a student's browser is never sent the text at all — not hidden behind
     a button, not in the page source. */
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const store = await cookies();
  const teacher = secret ? await readSession(store.get(TEACHER_COOKIE)?.value, secret) : null;
  const isTeacher = teacher?.role === "teacher";

  /* What this student has already written for this question, with the
     teacher's marks once checked — so it is right there when they come back. */
  const mine: Writing[] = me.role === "student" && writingsReady()
    ? await writingsForStudentTask(me.sid, task.id).catch(() => [])
    : [];

  // Task 1: the lesson and video for this chart type, one tap away
  const learn = task.kind === "task1" ? lessonForType(task.chartType) : null;
  // Task 2: this topic's own video lesson, if it has one, and the essay structure
  const vocab = await topicVocab(task);
  const topicVideo = task.kind === "task2" ? task.links?.find((u) => /youtu\.?be/i.test(u)) : undefined;

  return (
    <div className="wrap">
      {learn && (
        <div className="ln-first" style={{ marginTop: 16 }}>
          <div><b>{task.chartType}:</b> not sure how to start? Watch the video and read the lesson first.</div>
          <Link className="btn btn-outline" href={`/practice/learn/${learn.id}`} prefetch={false}>▶ Video &amp; lesson</Link>
        </div>
      )}
      {topicVideo && (
        <div style={{ marginTop: 16 }}>
          <VideoNote url={topicVideo}><b>{task.title}:</b> watch the video lesson on this topic — ideas and vocabulary for your essay.</VideoNote>
        </div>
      )}
      {task.kind === "task2" && (
        <VideoNote url={TASK2_STRUCTURE_VIDEO} label="▶ Watch">
          <b>Essay structure:</b> introduction, two body paragraphs, conclusion — how to plan it in 40 minutes.
        </VideoNote>
      )}
      {vocab && <TopicVocab title={task.title} v={vocab} />}
      <WritingDesk task={isTeacher ? task : forStudent(task)}
        start={q !== undefined && Number(q) >= 0 && Number(q) < (task.prompts?.length ?? 0) ? Math.floor(Number(q)) : undefined} />

      {me.role === "student" && (
        <MyWriting items={mine} hideQuestion title="Your saved answers to this question"
          empty="When you press “I have finished”, your answer is saved here and your teacher checks it. Checked answers show your mistakes underlined in red." />
      )}

      {isTeacher && (task.sampleText || task.sampleImages?.length) && (
        <section className="pr-set wr-model">
          <h2>Model answer — teachers only</h2>
          <p className="pr-note" style={{ marginTop: 0 }}>
            Not shown to students on this page. Read it out, pull it apart in class,
            hand it over after they have written their own — but it never appears
            beside a blank box.
          </p>
          {task.sampleImages?.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={`/practice/writing/${src}`} alt="Model answer" className="wr-model-img" />
          ))}
          {task.sampleText && <pre className="wr-model-txt">{task.sampleText}</pre>}
        </section>
      )}
    </div>
  );
}
