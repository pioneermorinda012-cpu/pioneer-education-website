import Link from "next/link";
import { getWriting, CHART_TYPES, ESSAY_TYPES } from "@/lib/writing";
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
    note: "One topic can be asked several ways, so each card holds every question printed under it. Pick one and argue it — or choose an essay type above to practise one kind of question at a time.",
  },
} as const;

const TONE_HEAD = {
  formal: "Formal letters — to a company, an official, a manager or someone you don't know well",
  informal: "Informal letters — to a friend or family member",
} as const;

export default async function WritingLibrary({
  searchParams,
}: {
  searchParams: Promise<{ task?: string; type?: string; reg?: string; cat?: string }>;
}) {
  await requireStudent("/practice/writing");
  const { task, type, reg, cat } = await searchParams;
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

  /* GT letters are practised by tone: formal (a company, a manager, a
   * neighbour — "Dear Sir or Madam" / "Dear Mr Smith") or informal (a friend —
   * "Dear Anna"). Semi-formal letters sit with the formal ones and keep their
   * own label, since they use the same polite, full forms. */
  const tone = (t: { register?: string }) => (t.register === "Informal" ? "informal" : "formal");
  const tones = kind === "gt1"
    ? (["formal", "informal"] as const).map((g) => ({ g, n: ofKind.filter((t) => tone(t) === g).length }))
        .filter((x) => x.n)
    : [];
  const pickedTone = tones.some((x) => x.g === reg) ? (reg as "formal" | "informal") : undefined;

  /* Task 2 is practised by essay type. The types belong to questions, not
   * topics, so a type tab lists every question of that type, each opening its
   * own topic on that question. */
  const questions = kind === "task2"
    ? ofKind.flatMap((t) => (t.prompts ?? []).map((q, i) => ({ t, q, i, type: t.types?.[i] })))
    : [];
  const cats = ESSAY_TYPES.map((e) => ({ ...e, n: questions.filter((x) => x.type === e.key).length }))
    .filter((x) => x.n);
  const pickedCat = cats.find((x) => x.key === cat);
  const asked = pickedCat ? questions.filter((x) => x.type === pickedCat.key) : [];
  const typeTab = (k?: string) => ESSAY_TYPES.find((e) => e.key === k)?.tab;

  const mine = picked
    ? ofKind.filter((t) => t.chartType === picked)
    : pickedTone
      ? ofKind.filter((t) => tone(t) === pickedTone)
      : ofKind;

  /* In the "All" view of letters, show them under a Formal and an Informal
   * heading; everywhere else it is one list. */
  const sections: { head?: string; items: typeof mine }[] =
    kind === "gt1" && !pickedTone
      ? tones.map(({ g }) => ({ head: TONE_HEAD[g], items: mine.filter((t) => tone(t) === g) }))
      : [{ items: mine }];

  return (
    <div className="wrap">
      <PracticeNav active={page.nav} />

      <div className="pr-head">
        <h1>{page.title}</h1>
        <span className="meta">
          {pickedCat ? `${asked.length} questions` : `${mine.length} ${page.unit}`} · {page.meta}
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

      {tones.length > 0 && (
        <nav className="wr-types" aria-label="Letter type">
          <Link href="/practice/writing?task=gt1" aria-current={!pickedTone ? "page" : undefined}>
            All <span>{ofKind.length}</span>
          </Link>
          {tones.map(({ g, n }) => (
            <Link key={g} href={`/practice/writing?task=gt1&reg=${g}`}
              aria-current={pickedTone === g ? "page" : undefined}>
              {g === "formal" ? "Formal" : "Informal"} <span>{n}</span>
            </Link>
          ))}
        </nav>
      )}

      {cats.length > 0 && (
        <nav className="wr-types" aria-label="Essay type">
          <Link href="/practice/writing?task=2" aria-current={!pickedCat ? "page" : undefined}>
            All topics <span>{ofKind.length}</span>
          </Link>
          {cats.map((c) => (
            <Link key={c.key} href={`/practice/writing?task=2&cat=${c.key}`}
              aria-current={pickedCat?.key === c.key ? "page" : undefined}>
              {c.tab} <span>{c.n}</span>
            </Link>
          ))}
        </nav>
      )}

      {pickedCat && (
        <div>
          <h2 style={{ fontFamily: "'Fraunces',serif", color: "var(--navy)", fontSize: "1.2rem", margin: "26px 0 0" }}>
            {pickedCat.head}
          </h2>
          <div className="pr-rows" style={{ marginTop: 10 }}>
            {asked.map(({ t, q, i }) => (
              <div className="pr-row" key={`${t.id}-${i}`}>
                <div>
                  <div className="nm" style={{ fontWeight: 500 }}>{q}</div>
                  <div className="fx">
                    <span>{t.title}</span>
                    <span>{t.minutes} minutes</span>
                    <span>at least {t.minWords} words</span>
                  </div>
                </div>
                <Link className="btn btn-coral" href={`/practice/writing/${t.id}?q=${i}`}
                  style={{ padding: "8px 16px", fontSize: "0.82rem", minHeight: 38 }}>
                  Write
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {!pickedCat && sections.map((sec, si) => (
      <div key={si}>
      {sec.head && (
        <h2 style={{ fontFamily: "'Fraunces',serif", color: "var(--navy)", fontSize: "1.2rem",
          margin: "26px 0 0" }}>
          {sec.head}
        </h2>
      )}
      <div className="pr-rows" style={{ marginTop: sec.head ? 10 : 18 }}>
        {sec.items.map((t) => (
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
                {[...new Set(t.types ?? [])].map((k) => <span key={k}>{typeTab(k)}</span>)}
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
      </div>
      ))}

      {!pickedCat && !mine.length && (
        <div className="pr-note">Nothing here yet.</div>
      )}
    </div>
  );
}
