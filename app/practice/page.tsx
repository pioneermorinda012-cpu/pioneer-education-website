import Link from "next/link";
import { getCatalogue, SKILLS, type SkillCode } from "@/lib/catalogue";

export default async function PracticeHome({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const { skill } = await searchParams;
  const active: SkillCode = (SKILLS.some((s) => s.code === skill) ? skill : "AL") as SkillCode;

  const catalogue = await getCatalogue();
  const mine = catalogue.filter((t) => t.skill === active);

  // group into the sets they were published in
  const sets: { name: string; tests: typeof mine }[] = [];
  for (const t of mine) {
    const found = sets.find((s) => s.name === t.set);
    if (found) found.tests.push(t);
    else sets.push({ name: t.set, tests: [t] });
  }

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
                  <span className="pr-band none">Not attempted</span>
                </div>
                <div className="go">
                  {t.keyed ? (
                    <Link className="btn btn-coral" href={`/practice/test/${t.id}`}>
                      Start
                    </Link>
                  ) : (
                    <span className="pr-band none">Answer key pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {ready < mine.length && (
        <div className="pr-note">
          <b>Some tests are not markable yet.</b> The question papers are ready, but their
          answer keys have not been added, so they cannot give a band score. They will turn
          on automatically once the keys are in.
        </div>
      )}
    </div>
  );
}
