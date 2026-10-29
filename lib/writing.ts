import fs from "node:fs/promises";
import path from "node:path";
import type { LetterCheck } from "./writing-score";

/**
 * The writing library.
 *
 * Task 1 is chart work, so each task keeps the page it came from as an image —
 * the chart IS the question and cannot be flattened into a sentence. Task 2 is
 * argument, so its prompts are words, which a student can read at any size on a
 * phone and which we can search.
 *
 * Model answers are the one thing in here that never goes to a student. A band
 * 4 script handed over before they have written a line is not a lesson, it is
 * something to copy, so `forStudent()` strips them on the server and the
 * browser is never sent them at all.
 */

const CONTENT = path.join(process.cwd(), "content", "writing");

export type WritingTask = {
  id: string;
  /** task1 = Academic chart, gt1 = General Training letter, task2 = essay */
  kind: "task1" | "gt1" | "task2";
  /** GT letters: Formal / Semi-formal / Informal */
  register?: string;
  /** Task 1: the sentence that sets the task. Task 2: the topic name. */
  title: string;
  minutes: number;
  minWords: number;
  /** Task 1 Academic only — what kind of visual it is, for sorting the list. */
  chartType?: string;
  /** Task 1 only — the page images that carry the chart. */
  images?: string[];
  /** Task 2 only — every question printed under this topic. */
  prompts?: string[];
  /** Task 2 only — the essay type of each question, in the same order as
      `prompts` (see ESSAY_TYPES). Written by scripts/t2types.py. */
  types?: string[];
  /** Task 2 only — the notes printed beside the topic, offered as a hint. */
  ideas?: string[];
  links?: string[];
  /** Task 2: a mock-test question — no topic vocabulary is shown before it. */
  mock?: boolean;
  /** GT letters: what this letter must contain, for the instant check. */
  check?: LetterCheck;
  /** GT letters: phrases worth borrowing, shown once the student has finished. */
  phrases?: string[];
  /** TEACHER ONLY. Never present in what a student is served. */
  sampleText?: string;
  sampleImages?: string[];
};

type Raw = Omit<WritingTask, "kind" | "title"> & { title?: string; topic?: string };

async function read(file: string, kind: WritingTask["kind"]): Promise<WritingTask[]> {
  let raw: Raw[];
  try {
    raw = JSON.parse(await fs.readFile(path.join(CONTENT, `${file}.json`), "utf8"));
  } catch {
    return [];
  }
  return raw.map((t) => ({
    ...t,
    kind,
    title: t.title ?? t.topic ?? t.id,
    minutes: t.minutes ?? (kind === "task2" ? 40 : 20),
    minWords: t.minWords ?? (kind === "task2" ? 250 : 150),
  }));
}

export async function getWriting(): Promise<WritingTask[]> {
  const [a, g, b] = await Promise.all([read("task1", "task1"), read("task1gt", "gt1"), read("task2", "task2")]);
  return [...a, ...g, ...b];
}

export async function getWritingTask(id: string): Promise<WritingTask | null> {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  return (await getWriting()).find((t) => t.id === id) ?? null;
}

/** The same task with everything a student must not see removed. */
export function forStudent(t: WritingTask): WritingTask {
  const { sampleText: _s, sampleImages: _i, ...rest } = t;
  return rest;
}

/* ---------- Task 2 topic vocabulary (content/writing/task2-vocab.json) ---------- */

export type TopicVocab = {
  /** topic words with a short meaning */
  words: { w: string; m: string }[];
  /** a basic sentence and its Band 7+ / C1 version */
  upgrades: { basic: string; better: string }[];
  collocations: string[];
};

/** The vocabulary for one Task 2 topic, or null (none written, or a mock test). */
export async function topicVocab(task: WritingTask): Promise<TopicVocab | null> {
  if (task.kind !== "task2" || task.mock) return null;
  try {
    const all = JSON.parse(await fs.readFile(path.join(CONTENT, "task2-vocab.json"), "utf8")) as Record<string, TopicVocab>;
    return all[task.id] ?? null;
  } catch {
    return null;
  }
}

/** Where the Task 1 page images are served from. */
export const writingImage = (name: string) => `/practice/writing/${name}`;

/** Task 2 essay types, in the order the tabs show them. A topic can hold
    questions of several types, so a type tab lists questions, not topics. */
export const ESSAY_TYPES = [
  { key: "agree", tab: "Agree / disagree", head: "Agree or disagree — “To what extent do you agree or disagree?”" },
  { key: "discuss", tab: "Opinion — both views", head: "Opinion — “Discuss both views and give your own opinion.”" },
  { key: "adv", tab: "Advantages & disadvantages", head: "Advantages and disadvantages — including “Do the advantages outweigh the disadvantages?”" },
  { key: "problem", tab: "Problem & solution", head: "Problem and solution — causes, effects and what can be done" },
  { key: "two", tab: "Two-part question", head: "Two-part questions — answer both questions" },
] as const;

/** The order the chart types are offered in, most common in the exam first. */
export const CHART_TYPES = [
  "Bar chart", "Line graph", "Pie chart", "Table", "Two charts (mixed)", "Map / plan", "Process diagram",
];
