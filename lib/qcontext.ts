/* SERVER ONLY. Everything an explanation needs about one question.
 *
 * The player builds the same index in the browser so it can show the question
 * text in the review, but it must never see the key, so the half that knows the
 * right answer lives here.
 */

type Row = string | { t: string };
type Cell = string | { t: string };
type Q = { n: number; stem: string; opts?: (string | { l: string; t: string })[]; multi?: boolean };
type Group = {
  title?: string; instr?: string; heading?: string;
  bankTitle?: string; bank?: [string, string][];
  lines?: Row[]; table?: Cell[][]; questions?: Q[]; opts?: (string | { l: string; t: string })[];
};
type Section = {
  label: string; qs: number[]; groups: Group[];
  passage?: { title: string; sub?: string; paras: (string | { l?: string; t: string })[] };
};
type TestLike = { mode: string; sections: Section[] };

export type QContext = {
  sectionLabel: string;
  passageTitle?: string;
  passage?: string;
  title?: string;
  instr?: string;
  stem: string;
  choices?: string[];
  covers: number[];
};

const text = (s: string) =>
  String(s).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const gapsIn = (s: string) => [...s.matchAll(/\{\{(\d+)[a-z]?\}\}/g)].map((m) => Number(m[1]));

/** Which question numbers each answer slot stands for — a three-mark task
 *  covers three. Mirrors coverageIn() in the player. */
function coverage(section: Section): Record<number, number[]> {
  const slots: number[] = [];
  for (const g of section.groups) {
    g.lines?.forEach((l) => slots.push(...gapsIn(typeof l === "object" ? l.t : l)));
    g.table?.forEach((r) => r.forEach((c) => slots.push(...gapsIn(typeof c === "object" ? c.t : c))));
    g.questions?.forEach((q) => slots.push(q.n));
  }
  const ordered = [...new Set(slots)].sort((a, b) => a - b);
  const qs = [...section.qs].sort((a, b) => a - b);
  const out: Record<number, number[]> = {};
  ordered.forEach((n, i) => {
    const next = i + 1 < ordered.length ? ordered[i + 1] : Infinity;
    const claimed = qs.filter((q) => q >= n && q < next);
    out[n] = claimed.length ? claimed : [n];
  });
  return out;
}

const optText = (o: string | { l: string; t: string }, i: number) =>
  typeof o === "object" ? `${o.l} ${o.t}` : `${"ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i]} ${o}`;

export function contextFor(test: TestLike, n: number): QContext | null {
  for (const section of test.sections) {
    if (!section.qs.includes(n)) continue;
    const cover = coverage(section);
    const lead = Number(Object.keys(cover).find((k) => cover[Number(k)].includes(n)) ?? n);
    const covers = cover[lead] ?? [n];

    const passage = section.passage
      ? section.passage.paras
          .map((p) => (typeof p === "object" ? `${p.l ? `[${p.l}] ` : ""}${text(p.t)}` : text(p)))
          .join("\n\n")
      : undefined;

    const base = {
      sectionLabel: section.label,
      passageTitle: section.passage?.title,
      passage,
      covers,
    };

    for (const g of section.groups) {
      const q = g.questions?.find((x) => x.n === lead);
      if (q) {
        const opts = q.opts ?? g.opts;
        const bank = g.bank?.map(([l, t]) => (l === t ? l : `${l} ${t}`));
        return {
          ...base,
          title: g.title, instr: text(g.instr ?? ""),
          stem: text(q.stem),
          choices: opts ? opts.map(optText) : bank,
        };
      }
      const fromText = (t: string) => {
        if (!gapsIn(t).includes(lead)) return null;
        return text(t.replace(/\{\{(\d+)[a-z]?\}\}/g, (_, d) =>
          Number(d) === lead ? " _____ " : ` (answer ${d}) `));
      };
      for (const l of g.lines ?? []) {
        const hit = fromText(typeof l === "object" ? l.t : l);
        if (hit) return { ...base, title: g.title, instr: text(g.instr ?? ""), stem: hit,
          choices: g.bank?.map(([a, b]) => (a === b ? a : `${a} ${b}`)) };
      }
      for (const r of g.table ?? []) {
        for (const c of r) {
          const hit = fromText(typeof c === "object" ? c.t : c);
          if (hit) return { ...base, title: g.title, instr: text(g.instr ?? ""),
            stem: `(in a table) ${hit}` };
        }
      }
    }
    return { ...base, title: undefined, instr: undefined, stem: `Question ${n}` };
  }
  return null;
}
