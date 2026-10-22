/* Bands kept apart by skill — Listening, Reading, Writing — so a student and
 * the teacher can see which one is holding the overall score down. One mixed
 * "best band" says a student is a 6.5; this says they are a 7 in Listening
 * and a 5.5 in Writing, which is the thing worth teaching.
 *
 * Pure functions on plain rows: no database, no secrets, no answer keys, so
 * the teacher page (a client component) and the results page share it. */

export type AreaKey = "L" | "RA" | "RG" | "W";

export type AreaSummary = {
  key: AreaKey;
  label: string;
  count: number;
  latest: number;
  best: number;
  avg: number;
  /** oldest first, for the small trend line */
  points: number[];
  /** one line under the numbers, e.g. "3 checked by teacher" */
  note?: string;
};

type TestRow = { skill: string; band: number | string; submitted_at: string };
type WritingRow = {
  kind: string; status: string; submitted_at: string;
  teacher_band: number | null; auto_band: number | null;
};

const AREA_OF: Record<string, AreaKey> = { AL: "L", GL: "L", AR: "RA", GR: "RG" };
const LABEL: Record<AreaKey, string> = {
  L: "Listening", RA: "Academic Reading", RG: "GT Reading", W: "Writing",
};
const ORDER: AreaKey[] = ["L", "RA", "RG", "W"];

const round = (n: number) => Math.round(n * 10) / 10;

function sum(key: AreaKey, rows: { band: number; when: string }[], note?: string): AreaSummary {
  const chrono = rows.slice().sort((a, b) => a.when.localeCompare(b.when));
  const bands = chrono.map((r) => r.band);
  return {
    key,
    label: LABEL[key],
    count: bands.length,
    latest: bands[bands.length - 1],
    best: Math.max(...bands),
    avg: round(bands.reduce((s, b) => s + b, 0) / bands.length),
    points: bands,
    ...(note ? { note } : {}),
  };
}

/** One summary per skill that has at least one result, in a fixed order. */
export function summarise(tests: TestRow[], writings: WritingRow[] = []): AreaSummary[] {
  const groups: Partial<Record<AreaKey, { band: number; when: string }[]>> = {};
  for (const t of tests) {
    const k = AREA_OF[t.skill];
    const band = Number(t.band);
    if (!k || !Number.isFinite(band)) continue;
    (groups[k] ??= []).push({ band, when: t.submitted_at });
  }

  /* Writing: the teacher's band once the piece is checked, the instant
     estimate until then — and the card says which it is. */
  let checked = 0;
  const w: { band: number; when: string }[] = [];
  for (const x of writings) {
    const isChecked = x.status === "checked" && x.teacher_band != null;
    const band = isChecked ? Number(x.teacher_band) : x.auto_band == null ? NaN : Number(x.auto_band);
    if (!Number.isFinite(band)) continue;
    if (isChecked) checked++;
    w.push({ band, when: x.submitted_at });
  }

  const out: AreaSummary[] = [];
  for (const k of ORDER) {
    if (k === "W") {
      if (w.length) {
        out.push(sum("W", w,
          checked === w.length ? `all ${checked} checked by teacher`
            : checked ? `${checked} of ${w.length} checked by teacher · rest are estimates`
              : "estimates · not checked by teacher yet"));
      }
    } else if (groups[k]?.length) {
      out.push(sum(k, groups[k]!));
    }
  }
  return out;
}

/** The skill to work on first: lowest average, once two skills have results. */
export function weakest(areas: AreaSummary[]): { weak: AreaSummary; strong: AreaSummary } | null {
  if (areas.length < 2) return null;
  const sorted = areas.slice().sort((a, b) => a.avg - b.avg);
  const weak = sorted[0], strong = sorted[sorted.length - 1];
  if (strong.avg - weak.avg < 0.5) return null; // too close to call
  return { weak, strong };
}
