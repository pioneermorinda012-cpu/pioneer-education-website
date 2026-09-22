import Link from "next/link";
import { cookies } from "next/headers";
import { getCatalogue, SKILLS, type SkillCode } from "@/lib/catalogue";
import { attemptsForStudent, attemptsReady } from "@/lib/attempts";
import { requireStudent } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function PracticeHome({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const { skill } = await searchParams;
  const active: SkillCode = (SKILLS.some((s) => s.code === skill) ? skill : "AL") as SkillCode;

  // Nothing is read, and nothing is rendered, until we know who is asking.
  const session = await requireStudent(`/practice?skill=${active}`);

  const catalogue = await getCatalogue();
  const mine = catalogue.filter((t) => t.skill === active);

  // group into the sets they were published in
  const sets: { name: string; tests: typeof mine }[] = [];
  for (const t of mine) {
    const found = sets.find((s) => s.name === t.set);
    if (found) found.tests.push(t);
    else sets.push({ name: t.set, tests: [t] });
  }

  // What this student has already done, so a finished test says so.
  const best: Record<string, { band: number; tries: number; when: string }> = {};
  if (session && attemptsReady()) {
    try {
      for (const a of await attemptsForStudent(session.sid)) {
        const cur = best[a.test_id];
        const band = Number(a.band);
        if (!cur) best[a.test_id] = { band, tries: 1, when: a.submitted_at };
        else {
          cur.tries++;
          if (band > cur.band) cur.band = band;
          if (a.submitted_at > cur.when) cur.when = a.submitted_at;
        }
      }
    } catch { /* results are a nicety; never keep a student out of the library */ }
  }
  const doneCount = mine.filter((t) => best[t.id]).length;

  const label = SKILLS.find((s) => s.code === active)!.label;
  const ready = mine.filter((t) => t.keyed).length;

  const track = active === "GR" || active === "GL" ? "gt" : "ac";

  return (
    <div className="wrap" data-track={track}>
      <nav className="pr-skills" aria-label="Choose a skill">
        {SKILLS.map((s) =>
          s.available ? (
            <Link
              key={s.code}
              href={`/practice?skill=${s.code}`}
              aria-current={s.code === active ? "page" : undefined}
            >
              {s.label}
            </Link>
          ) : (
            <span key={s.code}>{s.label} — soon</span>
          )
        )}
        {/* Writing is not a marked paper like the others, so it sits at the end
            of the row rather than pretending to be one. */}
        <Link href="/practice/writing?task=2">Writing</Link>
      </nav>

      <div className="pr-head">
        <h1>{label}</h1>
        <span className="meta">
          {mine.length} {mine.length === 1 ? "test" : "tests"}
          {ready < mine.length ? ` · ${ready} ready to mark` : ""}
        </span>
      </div>

      {mine.length === 0 && (
        <div className="pr-note">
          No {label.toLowerCase()} tests yet. They will appear here as soon as they are added.
        </div>
      )}

      {sets.map((set) => (
        <section className="pr-set" key={set.name}>
          <h2>{set.name}</h2>
          <div className="pr-rows">
            {set.tests.map((t) => (
              <div className="pr-row" key={t.id}>
                <div>
                  <div className="nm">
                    {label} — {t.label}
                  </div>
                  <div className="fx">
                    <span>{t.total} questions</span>
                    <span>{t.minutes} minutes</span>
                    <span>
                      {t.sections} {t.mode === "listening" ? "parts" : "sections"}
                    </span>
                  </div>
                </div>
                <div>
                  {best[t.id] ? (
                    <span
                      className={"pr-band " + (best[t.id].band >= 7 ? "hi" : best[t.id].band >= 5.5 ? "mid" : "lo")}
                      title={`${best[t.id].tries} attempt${best[t.id].tries === 1 ? "" : "s"}`}
                    >
                      <span className="lb">done</span>{best[t.id].band.toFixed(1)}
                      {best[t.id].tries > 1 && <span className="lb">×{best[t.id].tries}</span>}
                    </span>
                  ) : (
                    <span className="pr-band none">{t.keyed ? "Not attempted" : "Not marked here"}</span>
                  )}
                </div>
                <div className="go">
                  {t.keyed ? (
                    <Link
                      className={best[t.id] ? "btn btn-outline" : "btn btn-coral"}
                      href={`/practice/test/${t.id}`}
                    >
                      {best[t.id] ? "Do it again" : "Start"}
                    </Link>
                  ) : (
                    /* No answer key yet is not a reason to lock the paper away.
                       A student can still sit it under the clock and take their
                       answer sheet to class; what they cannot get is a band
                       score, and the button says so rather than pretending. */
                    <Link className="btn btn-outline" href={`/practice/test/${t.id}`}>
                      Practise
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {ready < mine.length && (
        <div className="pr-note">
          <b>Some papers are marked “Practise”.</b> The questions are ready and you can sit
          them under the clock, but their answer key is not on the site yet, so there is no
          band score — you get your answer sheet to mark against the book in class. They
          start scoring automatically the day the key is added.
        </div>
      )}
    </div>
  );
}
