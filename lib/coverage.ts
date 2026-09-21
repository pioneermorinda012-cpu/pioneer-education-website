/* Which question numbers each answer slot stands for.
 *
 * A "Choose THREE letters" task is one tick-box block, but it is worth three
 * marks: questions 20, 21 and 22. The paper names only question 20, so the
 * screen jumped from 20 straight to 23 and students reported the missing
 * numbers as a fault in the test. They were right to: a paper that says it has
 * forty questions must show forty numbers.
 *
 * Each slot claims the question numbers from its own up to the next slot's, so
 * an ordinary question claims one and a three-mark task claims three. Nothing
 * is marked up in the papers themselves, so every test — including any added
 * later — is numbered correctly without being touched.
 *
 * Isomorphic on purpose: the browser needs this to draw the numbers, and the
 * server needs it to know which question an explanation is about.
 */

export type CoverSection = {
  qs: number[];
  groups: {
    lines?: (string | { t: string })[];
    table?: (string | { t: string })[][];
    questions?: { n: number }[];
  }[];
};

const gapsIn = (s: string) =>
  [...String(s).matchAll(/\{\{(\d+)[a-z]?\}\}/g)].map((m) => Number(m[1]));

export function slotsIn(section: CoverSection): number[] {
  const out: number[] = [];
  for (const g of section.groups) {
    g.lines?.forEach((l) => out.push(...gapsIn(typeof l === "object" ? l.t : l)));
    g.table?.forEach((r) => r.forEach((c) => out.push(...gapsIn(typeof c === "object" ? c.t : c))));
    g.questions?.forEach((q) => out.push(q.n));
  }
  return out;
}

export function coverageIn(section: CoverSection): Record<number, number[]> {
  const slots = [...new Set(slotsIn(section))].sort((a, b) => a - b);
  const qs = [...section.qs].sort((a, b) => a - b);
  const cover: Record<number, number[]> = {};
  slots.forEach((n, i) => {
    const next = i + 1 < slots.length ? slots[i + 1] : Infinity;
    const claimed = qs.filter((q) => q >= n && q < next);
    cover[n] = claimed.length ? claimed : [n];
  });
  return cover;
}

export const rangeLabel = (covers: number[]) =>
  covers.length > 1 ? `${covers[0]}–${covers[covers.length - 1]}` : String(covers[0]);
