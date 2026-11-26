import type { Area } from "@/lib/access";

/**
 * The IELTS skill labs — Listening, Reading, Writing and Speaking. Each is a
 * self-contained page (units, word banks, model answers, a quick check) kept
 * whole in content/labs and served by app/practice/lab/[id]/route.ts. Each one
 * is linked from the top of its own section: the Listening tests, the Reading
 * tests, the Writing pages; Speaking has no tests, so the Speaking page (app/practice/speaking) lists it with the 31 Speaking Formulas.
 * All four cover Academic and General Training.
 */
export type LabItem = {
  id: string;
  file: string;
  title: string;
  blurb: string;
  need: Area[];
  /** "task" = a single-question-type reading trainer, listed under the Reading
   *  tests. "speak" = Part 2 / vocabulary material listed on the Speaking page.
   *  Absent means one of the four big labs. */
  kind?: "task" | "speak";
  /** how many questions it holds, shown in the list */
  count?: number;
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
  { id: "speaking-formulas", file: "speaking-formulas.html", title: "31 Speaking Formulas", need: ["academic", "gt"],
    blurb: "31 ready-to-use answer patterns for Parts 1, 2 and 3 — each with a model answer to listen to, power phrases, a mistake to avoid and a practice question." },

  /* Task-type trainers. One question type at a time, over nine Pioneer
   * passages, so a student who keeps losing marks on one style can drill that
   * style alone instead of sitting a whole paper to meet it four times.
   * Every answer is proved against a line of the passage. */
  { id: "task-true-false", file: "task-true-false.html", kind: "task", count: 72,
    title: "True / False / Not Given", need: ["academic", "gt"],
    blurb: "The question type that costs the most marks. FALSE and NOT GIVEN are highlighted in different colours, so you can see why a line that looked right was not enough." },
  { id: "task-matching-information", file: "task-matching-information.html", kind: "task", count: 54,
    title: "Matching Information", need: ["academic", "gt"],
    blurb: "Which paragraph contains the following information? Deliberately out of passage order, as the real test has it." },
  { id: "task-summary-completion", file: "task-summary-completion.html", kind: "task", count: 54,
    title: "Summary Completion", need: ["academic", "gt"],
    blurb: "Type the missing words. Tells you whether you lost the mark to the word limit, to spelling, or to the wrong word." },
  { id: "task-matching-headings", file: "task-matching-headings.html", kind: "task", count: 49,
    title: "Matching Headings", need: ["academic", "gt"],
    blurb: "Choose the heading that covers the whole paragraph. The unused headings are built as traps, and each answer names the one that was aimed at you." },
  { id: "task-multiple-choice", file: "task-multiple-choice.html", kind: "task", count: 45,
    title: "Multiple Choice", need: ["academic", "gt"],
    blurb: "Choose A, B, C or D — with a one-line reason why each of the other three is wrong." },

  /* Speaking Part 2 packs and the vocabulary that feeds them. Each cue card
   * carries its vocabulary above it, and every bullet has one basic line and
   * one advanced line, so a student can build an answer at their own level. */
  { id: "speaking-part2-people", file: "speaking-part2-people.html", kind: "speak", count: 18,
    title: "Part 2: People", need: ["academic", "gt"],
    blurb: "18 cue cards about people, each with its vocabulary above it and two ways to say every bullet — one simple, one for Band 7." },
  { id: "speaking-part2-places", file: "speaking-part2-places.html", kind: "speak", count: 12,
    title: "Part 2: Places", need: ["academic", "gt"],
    blurb: "12 cue cards about places, in the same format: the words first, then a basic line and an advanced line for each bullet." },
  { id: "vocab-emotions", file: "vocab-emotions.html", kind: "speak", count: 54,
    title: "Emotions Vocabulary", need: ["academic", "gt"],
    blurb: "54 words for five families of feeling, arranged from mild to very strong — so you stop saying happy and sad, and stop saying infuriated about a late bus." },
];

/** The task-type trainers, in the order they are listed under the Reading tests. */
export const TASKS: LabItem[] = LABS.filter((l) => l.kind === "task");

/** The Speaking Part 2 packs and vocabulary, in the order the Speaking page lists them. */
export const SPEAKING_EXTRAS: LabItem[] = LABS.filter((l) => l.kind === "speak");

export const labItem = (id: string) => LABS.find((l) => l.id === id) ?? null;
