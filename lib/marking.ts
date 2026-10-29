/**
 * Server-side marking. This file must never be imported by a client component —
 * it is the reason the answer key stays off the student's device.
 */

/**
 * `pool` is for written answers that may go in any order across several boxes
 * ("Which THREE parts…?" with three gaps). Each box accepts any answer in the
 * set, but the same answer only earns a mark once — in the first box of the
 * pool where it appears — exactly as an examiner would mark it.
 */
export type SingleKey = { accept: string[]; display: string; pool?: string[] };
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

/* Numbers written as words count the same as figures, as in the real exam:
 * "eight to fourteen-year-olds" = "8-14 year-olds", "twenty-five" = "25",
 * "two thousand" stays as typed (a year or a big number is written in
 * figures in the keys). Applied to the key and the answer alike. */
const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
export function numberWords(v: unknown): string {
  let t = String(v ?? "").toLowerCase();
  const tens = Object.keys(TENS).join("|"), units = Object.keys(UNITS).filter((u) => UNITS[u] > 0 && UNITS[u] < 10).join("|");
  // "twenty-five", "twenty five" → 25
  t = t.replace(new RegExp(`\\b(${tens})[\\s-]+(${units})\\b`, "g"), (_, a: string, b: string) => String(TENS[a] + UNITS[b]));
  t = t.replace(new RegExp(`\\b(${tens})\\b`, "g"), (w: string) => String(TENS[w]));
  t = t.replace(new RegExp(`\\b(${Object.keys(UNITS).join("|")})\\b`, "g"), (w: string) => String(UNITS[w]));
  // a range: "8 to 14", "8 – 14" → "8-14"
  t = t.replace(/(\d)\s*(?:to|–|—|-)\s*(\d)/g, "$1-$2");
  return t;
}
const canon = (v: unknown) => normalise(numberWords(v));

function markSingle(key: SingleKey, id: string, all: StudentAnswers): boolean {
  const mine = normalise(all[id]);
  const ok = key.accept.map(normalise);
  const right = !!mine && (ok.includes(mine) || key.accept.map(canon).includes(canon(all[id])));
  if (!right) return false;
  if (!key.pool) return true;
  // an answer repeated in an earlier box of the same pool has already scored
  // "the entrances" and "entrances" — or "a signature" and "signature" — are the
  // same answer, so compare without an article
  const same = (v: unknown) => normalise(String(v ?? "").trim().replace(/^(the|an?)\s+/i, ""));
  const me = same(all[id]);
  for (const other of key.pool) {
    if (other === id) break;
    const theirs = normalise(all[other]);
    const scored = !!theirs && (ok.includes(theirs) || key.accept.map(canon).includes(canon(all[other])));
    if (scored && (same(all[other]) === me || canon(all[other]) === canon(all[id]))) return false;
  }
  return true;
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
  ev?: { s: number; t: string[]; k?: "exact" | "near" | "none" };
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
        : markSingle(k, id, answers);

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
