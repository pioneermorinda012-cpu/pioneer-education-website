import Link from "next/link";
import { getWriting } from "@/lib/writing";
import { requireStudent } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function WritingLibrary({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  await requireStudent("/practice/writing");
  const { task } = await searchParams;
  const kind = task === "1" ? "task1" : "task2";

  const all = await getWriting();
  const mine = all.filter((t) => t.kind === kind);

  return (
    <div className="wrap">
      <nav className="pr-skills" aria-label="Choose a task">
        <Link href="/practice/writing?task=2" aria-current={kind === "task2" ? "page" : undefined}>
          Task 2 — essay
        </Link>
        <Link href="/practice/writing?task=1" aria-current={kind === "task1" ? "page" : undefined}>
          Task 1 — chart
        </Link>
        <Link href="/practice">Listening &amp; Reading</Link>
      </nav>

      <div className="pr-head">
        <h1>{kind === "task1" ? "Writing Task 1" : "Writing Task 2"}</h1>
        <span className="meta">
          {mine.length} {kind === "task1" ? "tasks" : "topics"} ·{" "}
          {kind === "task1" ? "20 minutes, 150 words" : "40 minutes, 250 words"}
        </span>
      </div>

      <div className="pr-note">
        {kind === "task1"
          ? "Describe what the chart shows. No opinions, no reasons — report the figures, compare them, and give one sentence of overview."
          : "One topic can be asked several ways, so each card holds every question printed under it. Pick one and argue it."}
      </div>

      <div className="pr-rows" style={{ marginTop: 18 }}>
        {mine.map((t) => (
          <div className="pr-row" key={t.id}>
            <div>
              <div className="nm">{t.title}</div>
              <div className="fx">
                <span>{t.minutes} minutes</span>
                <span>at least {t.minWords} words</span>
                {t.prompts && t.prompts.length > 1 && (
                  <span>{t.prompts.length} questions</span>
                )}
                {t.ideas?.length ? <span>idea list</span> : null}
                {t.links?.length ? <span>video</span> : null}
              </div>
            </div>
            <Link className="btn btn-coral" href={`/practice/writing/${t.id}`}
              style={{ padding: "8px 16px", fontSize: "0.82rem", minHeight: 38 }}>
              Write
            </Link>
          </div>
        ))}
      </div>

      {!mine.length && (
        <div className="pr-note">Nothing here yet.</div>
      )}
    </div>
  );
}
