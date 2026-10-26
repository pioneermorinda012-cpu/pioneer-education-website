import type { Area } from "@/lib/access";

/**
 * The IELTS skill labs — Listening, Reading, Writing and Speaking. Each is a
 * self-contained page (units, word banks, model answers, a quick check) kept
 * whole in content/labs and served by app/practice/lab/[id]/route.ts. Each one
 * is linked from the top of its own section: the Listening tests, the Reading
 * tests, the Writing pages; Speaking has no tests, so it sits in the menu.
 * All four cover Academic and General Training.
 */
export type LabItem = {
  id: string;
  file: string;
  title: string;
  blurb: string;
  need: Area[];
};

export const LABS: LabItem[] = [
  { id: "listening", file: "listening-lab.html", title: "Listening Lab", need: ["academic", "gt"],
    blurb: "Spelling and numbers, distractors, paraphrase, maps and plans — the skills behind a Band 7 score, with audio read aloud." },
  { id: "reading", file: "reading-lab.html", title: "Reading Lab", need: ["academic", "gt"],
    blurb: "Paraphrase, scanning, True / False / Not Given and every question type, for Academic and General Training." },
  { id: "writing", file: "writing-lab.html", title: "Writing Lab", need: ["academic", "gt"],
    blurb: "GT letters, Academic reports and essays, and the grammar and vocabulary for Band 7 — unit by unit, with model answers." },
  { id: "speaking", file: "speaking-lab.html", title: "Speaking Lab", need: ["academic", "gt"],
    blurb: "Parts 1, 2 and 3: extending answers, Band 8 samples to listen to, and Part 2 cue cards with a timer." },
];

export const labItem = (id: string) => LABS.find((l) => l.id === id) ?? null;
