import fs from "node:fs/promises";
import path from "node:path";

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
  /** Task 1 only — the page images that carry the chart. */
  images?: string[];
  /** Task 2 only — every question printed under this topic. */
  prompts?: string[];
  /** Task 2 only — the notes printed beside the topic, offered as a hint. */
  ideas?: string[];
  links?: string[];
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

/** Where the Task 1 page images are served from. */
export const writingImage = (name: string) => `/practice/writing/${name}`;
