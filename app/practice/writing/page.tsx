import Link from "next/link";
import { getWriting, CHART_TYPES } from "@/lib/writing";
import { requireStudent } from "@/lib/guard";
import PracticeNav from "@/components/practice/PracticeNav";

export const dynamic = "force-dynamic";

const PAGES = {
  task1: {
    nav: "W1",
    title: "Writing Task 1 — Academic",
    unit: "tasks",
    meta: "20 minutes, 150 words",
    note: "Describe what the chart shows. No opinions, no reasons — report the figures, compare them, and give one sentence of overview.",
  },
  gt1: {
    nav: "WG",
    title: "Writing Task 1 — General Training letter",
    unit: "letters",
    meta: "20 minutes, 150 words",
    note: "Answer all three bullet points, one paragraph each, and match the tone to the reader: formal for a company, semi-formal for someone you know a little, informal for a friend. Open with the greeting you are given and sign off to match it.",
  },
  task2: {
    nav: "W2",
    title: "Writing Task 2 — Essay",
    unit: "topics",
    meta: "40 minutes, 250 words",
    note: "One topic can be asked several ways, so each card holds every question printed under it. Pick one and argue it.",
  },
} as const;

export default async function WritingLibrary({
  searchParams,
}: {
  searchParams: Promise<{ task?: string; type?: string }>;
}) {
  await requireStudent("/practice/writing");
  const { task, type } = await searchParams;
  const kind = task === "1" ? "task1" : task === "gt1" ? "gt1" : "task2";
  const page = PAGES[kind];

  const all = await getWriting();
  const ofKind = all.filter((t) => t.kind === kind);

  /* Task 1 Academic is practised by chart type — a student weak on maps
   * wants every map, not to scroll past twenty tables to find them. */
  const types = kind === "task1"
    ? CHART_TYPES.map((c) => ({ c, n: ofKind.filter((t) => t.chartType === c).length })).filter((x) => x.n)
    : [];
  const picked = types.some((x) => x.c === type) ? type : undefined;
  const mine = picked ? ofKind.filter((t) => t.chartType === picked) : ofKind;

  return (
    <div className="wrap">
      <PracticeNav active={page.nav} />

      <div className="pr-head">
        <h1>{page.title}</h1>
        <span className="meta">
          {mine.length} {page.unit} · {page.meta}
        </span>
      </div>

      <div className="pr-note">{page.note}</div>

      {types.length > 0 && (
        <nav className="wr-types" aria-label="Chart type">
          <Link href="/practice/writing?task=1" aria-current={!picked ? "page" : undefined}>
            All <span>{ofKind.length}</span>
          </Link>
          {types.map(({ c, n }) => (
            <Link key={c} href={`/practice/writing?task=1&type=${encodeURIComponent(c)}`}
              aria-current={picked === c ? "page" : undefined}>
              {c} <span>{n}</span>
            </Link>
          ))}
        </nav>
      )}

      <div className="pr-rows" style={{ marginTop: 18 }}>
        {mine.map((t) => (
          <div className="pr-row" key={t.id}>
            <div>
              <div className="nm">{t.title}</div>
              <div className="fx">
                {t.chartType && <span>{t.chartType}</span>}
                {t.register && <span>{t.register}</span>}
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
