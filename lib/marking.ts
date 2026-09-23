/**
 * Server-side marking. This file must never be imported by a client component —
 * it is the reason the answer key stays off the student's device.
 */

export type SingleKey = { accept: string[]; display: string };
export type MultiKey = {
  any: string[];      // the acceptable letters
  pick: number;       // how many the student must tick
  display: string;
  lead?: number;      // for a task spanning several question numbers
  idx?: number;       // 0 for the first mark of that run, 1 for the second…
};
export type AnswerKey = Record<string, SingleKey | MultiKey>;
export type StudentAnswers = Record<string, string | string[] | undefined>;

const isMulti = (k: SingleKey | MultiKey): k is MultiKey => "any" in k;

/**
 * IELTS marking ignores case, spacing and punctuation, so "Opera House",
 * "opera house" and "opera-house" all match. Spelling still has to be right.
 */
export function normalise(v: unknown): string {
  return String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function markMulti(key: MultiKey, all: StudentAnswers): boolean {
  const source = key.lead != null ? all[String(key.lead)] : undefined;
  const raw = key.lead != null ? source : all.__self;
  const picked = Array.isArray(raw) ? raw.map(normalise) : raw ? [normalise(raw)] : [];
  const unique = [...new Set(picked)];

  // Ticking more boxes than asked for scores nothing, as in the real exam.
  if (unique.length > key.pick) return false;

  const wanted = key.any.map(normalise);
  const hits = unique.filter((p) => wanted.includes(p)).length;

  // No lead => one question worth one mark: every letter must be right.
  // With a lead => a run of numbers, one mark per correct letter.
  return key.lead == null ? hits === key.pick : hits > (key.idx ?? 0);
}

export type MarkedQuestion = {
  n: string;
  correct: boolean;
  given: string;
  expected: string;
  /** filled in after marking — see lib/qtypes */
  type?: string;
  /** filled in after marking — the line in the passage, see lib/evidence */
  ev?: { s: number; t: string[] };
};

export type MarkResult = {
  raw: number;
  total: number;
  band: number;
  sections: { label: string; got: number; outOf: number }[];
  questions: MarkedQuestion[];
};

export function markAttempt(
  key: AnswerKey,
  answers: StudentAnswers,
  sections: { label: string; qs: number[] }[],
  bands: [number, number][],
  total: number
): MarkResult {
  let raw = 0;
  const questions: MarkedQuestion[] = [];
  const sectionScores = sections.map((s) => ({ label: s.label, got: 0, outOf: s.qs.length }));

  sections.forEach((section, si) => {
    for (const n of section.qs) {
      const id = String(n);
      const k = key[id];
      const given = answers[id];

      if (!k) {
        questions.push({ n: id, correct: false, given: display(given), expected: "—" });
        continue;
      }

      const correct = isMulti(k)
        ? markMulti(k, { ...answers, __self: given })
        : k.accept.map(normalise).includes(normalise(given));

      if (correct) {
        raw += 1;
        sectionScores[si].got += 1;
      }

      // for a run, show the ticks the student actually made on the lead question
      const shown = isMulti(k) && k.lead != null ? answers[String(k.lead)] : given;
      questions.push({ n: id, correct, given: display(shown), expected: k.display });
    }
  });

  return { raw, total, band: bandFor(raw, bands), sections: sectionScores, questions };
}

function display(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v.length ? v.join(", ").toUpperCase() : "(blank)";
  return v && String(v).trim() ? String(v) : "(blank)";
}

/** bands is [[minimumRawScore, band], …] sorted highest first. */
export function bandFor(raw: number, bands: [number, number][]): number {
  for (const [min, band] of bands) if (raw >= min) return band;
  return 0;
}
