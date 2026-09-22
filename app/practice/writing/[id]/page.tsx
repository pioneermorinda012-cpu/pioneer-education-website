import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import WritingDesk from "@/components/practice/WritingDesk";
import { getWritingTask, forStudent } from "@/lib/writing";
import { requireStudent } from "@/lib/guard";
import { readSession, TEACHER_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function WritingTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStudent(`/practice/writing/${id}`);

  const task = await getWritingTask(id);
  if (!task) notFound();

  /* The model answer is a teacher's tool. It is decided here, on the server,
     and a student's browser is never sent the text at all — not hidden behind
     a button, not in the page source. */
  const secret = process.env.PRACTICE_SESSION_SECRET ?? "";
  const store = await cookies();
  const teacher = secret ? await readSession(store.get(TEACHER_COOKIE)?.value, secret) : null;
  const isTeacher = teacher?.role === "teacher";

  return (
    <div className="wrap">
      <WritingDesk task={isTeacher ? task : forStudent(task)} />

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
