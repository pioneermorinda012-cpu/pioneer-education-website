/* Working out which kind of IELTS question a student got wrong.
 *
 * "You lose marks in the second half of the paper" is nearly useless to a
 * teacher. "You lose marks on Matching Headings" tells them what to teach on
 * Monday. The papers do not carry a type field, so it is read from the
 * instruction line, which is near enough standard wording across the exam.
 */

export type QType =
  | "Multiple choice"
  | "Multiple choice (two or more)"
  | "True / False / Not Given"
  | "Yes / No / Not Given"
  | "Matching headings"
  | "Matching information"
  | "Matching features"
  | "Sentence endings"
  | "Note completion"
  | "Table completion"
  | "Form completion"
  | "Flow-chart completion"
  | "Summary completion"
  | "Sentence completion"
  | "Diagram / map labelling"
  | "Short answer"
  | "Other";

const strip = (s: string) => String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export function classify(group: {
  instr?: string; heading?: string; title?: string; img?: string; bank?: unknown[];
}): QType {
  const text = strip(`${group.instr ?? ""} ${group.heading ?? ""}`).toLowerCase();
  const hasImage = Boolean(group.img);

  // Order matters: the more specific wording is tested first, because
  // "complete the notes" also contains "complete".
  if (/list of headings|suitable heading|suitable title for the whole/.test(text))
    return "Matching headings";
  if (/which (section|paragraph)s? (contains|mentions)|contains the following information/.test(text))
    return "Matching information";
  if (/correct ending|best ending/.test(text)) return "Sentence endings";
  if (/agree with the (views|claims)/.test(text)) return "Yes / No / Not Given";
  if (/agree with the information|true.*false.*not given/.test(text)) return "True / False / Not Given";

  if (/two letters|three letters|choose two|choose three|check two|select two/.test(text)
      || /which (two|three)\b|which (two|three) of the following/.test(text))
    return "Multiple choice (two or more)";
  if (/correct letter|correct answer|circle the correct|choose the correct|appropriate letters?/.test(text))
    return "Multiple choice";

  if (/label the|labels? (on|below)|complete the (map|plan|diagram)/.test(text) || (hasImage && /complete/.test(text)))
    return "Diagram / map labelling";

  if (/complete the flow[- ]?chart/.test(text)) return "Flow-chart completion";
  if (/complete the summary/.test(text)) return "Summary completion";
  if (/complete the table|complete the chart/.test(text)) return "Table completion";
  if (/complete the form/.test(text)) return "Form completion";
  if (/complete the notes|complete the note/.test(text)) return "Note completion";
  if (/complete the sentences|complete each sentence|complete each of the following statements/.test(text))
    return "Sentence completion";

  if (/match(ing)? .*(with|to)|which (person|writer|researcher|speaker)|given by each (writer|speaker)|answers? from the box/.test(text))
    return "Matching features";
  if (/answer the questions|short answer/.test(text)) return "Short answer";

  // A bare word-limit line, with no other clue, is a short-answer style gap.
  if (/no more than|one word only|words? (and\/or|or) a number/.test(text)) return "Short answer";

  return "Other";
}

/** question number -> type, for one paper */
export function typeMap(test: {
  sections?: { qs?: number[]; groups?: { qs?: { n: number }[]; instr?: string;
    heading?: string; img?: string; lines?: unknown[] }[] }[];
}): Record<string, QType> {
  const out: Record<string, QType> = {};
  for (const section of test.sections ?? []) {
    for (const group of section.groups ?? []) {
      const t = classify(group);
      // A group states its questions either as qs[] or implicitly through the
      // numbers in its title ("Questions 14–20").
      const nums = numbersIn(group);
      for (const n of nums) out[String(n)] = t;
    }
  }
  return out;
}

function numbersIn(group: Record<string, unknown>): number[] {
  const out: number[] = [];
  const qs = group.qs as { n?: number }[] | undefined;
  if (Array.isArray(qs)) for (const q of qs) if (typeof q?.n === "number") out.push(q.n);

  const scan = (v: unknown) => {
    if (typeof v === "string") {
      for (const m of v.matchAll(/\{\{(\d+)\}\}/g)) out.push(Number(m[1]));
    } else if (Array.isArray(v)) v.forEach(scan);
    else if (v && typeof v === "object") Object.values(v).forEach(scan);
  };
  for (const k of ["lines", "table", "opts", "rows"]) if (group[k]) scan(group[k]);

  // "Questions 14–20" in the title, when nothing else gave the numbers away
  if (!out.length && typeof group.title === "string") {
    const m = group.title.match(/(\d+)\s*[–—-]\s*(\d+)/);
    if (m) for (let i = Number(m[1]); i <= Number(m[2]); i++) out.push(i);
    else {
      const one = group.title.match(/\b(\d+)\b/);
      if (one) out.push(Number(one[1]));
    }
  }
  return [...new Set(out)];
}

/**
 * Roll per-question results up by type.
 *
 * Reports how many a student gets *right*, because "100% wrong" as the first
 * thing someone reads about their own work is discouraging and no more
 * informative than "0 right of 22". The weakest type still comes first — that
 * is the one worth a lesson — but it is described by what they are scoring.
 */
export function byType(
  rows: { type?: string; correct?: boolean }[],
): { type: string; right: number; wrong: number; total: number; pct: number; pctRight: number }[] {
  const acc: Record<string, { wrong: number; total: number }> = {};
  for (const r of rows) {
    const t = r.type || "Other";
    const slot = (acc[t] ??= { wrong: 0, total: 0 });
    slot.total++;
    if (!r.correct) slot.wrong++;
  }
  return Object.entries(acc)
    .map(([type, v]) => ({
      type, ...v,
      right: v.total - v.wrong,
      pct: v.total ? (v.wrong / v.total) * 100 : 0,
      pctRight: v.total ? ((v.total - v.wrong) / v.total) * 100 : 0,
    }))
    // A type seen twice tells you nothing; rank by weakest, then by how often.
    .sort((a, b) => a.pctRight - b.pctRight || b.total - a.total);
}
