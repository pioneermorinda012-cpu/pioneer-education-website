/**
 * Instant feedback on a piece of writing.
 *
 * This is not a band score and it does not pretend to be one. No program can
 * read an argument and judge whether it convinces; what a program can do is
 * count the things students lose easy marks on and that a teacher would
 * otherwise spend the first ten minutes of every lesson pointing out — too
 * short, one wall of text, the same six linking words, "I think" eleven times.
 * Those are worth catching in the thirty seconds after writing, while the essay
 * is still in the student's head.
 *
 * Everything here is deterministic and runs in the browser, so a student can
 * write and get an answer with no key, no network and no waiting. The estimate
 * is labelled as a guide throughout, and the teacher's mark is what counts.
 */

const STOP = new Set(
  ("the a an and or but if of to in on at for with as by from is are was were be been being this " +
   "that these those it its i you he she we they my your his her our their not no so very can " +
   "could will would should may might do does did have has had there here them him us me").split(" "));

const LINKERS = ["however", "moreover", "furthermore", "in addition", "additionally", "on the other hand",
  "therefore", "consequently", "as a result", "for example", "for instance", "in conclusion", "to conclude",
  "overall", "in summary", "firstly", "secondly", "finally", "in contrast", "despite", "although", "while",
  "whereas", "nevertheless", "nonetheless", "besides", "similarly", "likewise", "thus", "hence"];

const COMPLEX = ["because", "although", "though", "while", "whereas", "if", "unless", "since", "which",
  "who", "whom", "that", "whenever", "wherever", "despite", "in spite of", "even though", "provided that"];

/** Words a student leans on when they are not sure what else to say. */
const INFORMAL = ["a lot of", "lots of", "kids", "stuff", "things", "nowadays a lot", "big", "good", "bad",
  "very very", "etc", "and so on", "i think that", "in my opinion i"];

export type Note = { kind: "good" | "fix"; text: string };
export type Score = {
  words: number;
  sentences: number;
  paragraphs: number;
  avgSentence: number;
  varietyPct: number;
  linkers: string[];
  repeated: [string, number][];
  longSentences: number;
  estimate: number;
  notes: Note[];
};

const wordsOf = (t: string) => t.trim().match(/[A-Za-z']+/g) ?? [];
const sentencesOf = (t: string) =>
  (t.trim().match(/[^.!?]+[.!?]+/g) ?? (t.trim() ? [t.trim()] : [])).map((s) => s.trim());
const parasOf = (t: string) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

function occurrences(text: string, list: string[]): string[] {
  // Flatten the line breaks first. A paragraph that opens "However," is the
  // clearest possible use of a linking word, and matching on a leading space
  // alone would miss every one of them.
  const t = " " + text.toLowerCase().replace(/\s+/g, " ") + " ";
  return list.filter((l) => t.includes(" " + l + " ") || t.includes(" " + l + ","));
}

export function score(text: string, minWords: number, kind: "task1" | "task2"): Score {
  const ws = wordsOf(text);
  const ss = sentencesOf(text);
  const ps = parasOf(text);
  const words = ws.length;

  const content = ws.map((w) => w.toLowerCase()).filter((w) => !STOP.has(w) && w.length > 2);
  const varietyPct = content.length ? Math.round((new Set(content).size / content.length) * 100) : 0;

  const counts: Record<string, number> = {};
  for (const w of content) counts[w] = (counts[w] ?? 0) + 1;
  const repeated = Object.entries(counts)
    .filter(([, c]) => c >= 4 && c / Math.max(1, content.length) > 0.022)
    .sort((a, b) => b[1] - a[1]).slice(0, 4) as [string, number][];

  const linkers = occurrences(text, LINKERS);
  const complex = occurrences(text, COMPLEX);
  const informal = occurrences(text, INFORMAL);
  const avgSentence = ss.length ? Math.round((words / ss.length) * 10) / 10 : 0;
  const longSentences = ss.filter((s) => wordsOf(s).length > 40).length;

  /* An honest, narrow estimate. It starts at a middling band and moves only on
     things that can be counted without understanding the argument, and it never
     claims more than 7.5 — no counter can see whether the ideas are any good. */
  let est = 6;
  if (words < minWords) est -= Math.min(2, ((minWords - words) / minWords) * 4);
  if (words >= minWords + 40) est += 0.25;
  if (ps.length >= (kind === "task2" ? 4 : 3)) est += 0.5; else if (ps.length <= 1) est -= 1;
  if (linkers.length >= 5) est += 0.5; else if (linkers.length <= 1) est -= 0.5;
  if (complex.length >= 5) est += 0.5; else if (complex.length <= 1) est -= 0.5;
  if (varietyPct >= 62) est += 0.5; else if (varietyPct < 45) est -= 0.5;
  if (repeated.length >= 3) est -= 0.25;
  if (informal.length >= 3) est -= 0.25;
  if (avgSentence > 0 && (avgSentence < 9 || avgSentence > 30)) est -= 0.25;
  // Under the word count the examiner applies a penalty before judging anything
  // else, so no amount of good structure can rescue it. Saying otherwise would
  // send a student into the exam believing a short essay is survivable.
  const ceiling = words < minWords ? 5.5 : 7.5;
  const estimate = Math.max(3.5, Math.min(ceiling, Math.round(est * 2) / 2));

  const notes: Note[] = [];
  const say = (kind: Note["kind"], text: string) => notes.push({ kind, text });

  if (words < minWords) {
    say("fix", `${words} words. The task asks for at least ${minWords}, and an under-length answer is penalised before anything else is even read — you need ${minWords - words} more.`);
  } else {
    say("good", `${words} words — over the ${minWords} minimum, so nothing is lost on length.`);
  }

  if (ps.length <= 1) {
    say("fix", "It is one block of text. Break it into paragraphs — introduction, one idea per body paragraph, conclusion. This is the single quickest mark to gain.");
  } else if (ps.length >= (kind === "task2" ? 4 : 3)) {
    say("good", `${ps.length} paragraphs, which is the shape the examiner is looking for.`);
  } else {
    say("fix", `Only ${ps.length} paragraphs. ${kind === "task2" ? "Aim for four: introduction, two body paragraphs, conclusion." : "Aim for three: overview, then the detail in two groups."}`);
  }

  if (linkers.length <= 1) {
    say("fix", "Almost no linking words. Join your ideas with however, moreover, as a result, in contrast — the examiner is marking whether the reader is guided through.");
  } else if (linkers.length >= 5) {
    say("good", `You used ${linkers.length} different linking expressions: ${linkers.slice(0, 5).join(", ")}.`);
  }

  if (complex.length <= 1) {
    say("fix", "Every sentence is simple. Combine some with although, because, which, whereas — grammatical range is a whole quarter of the mark.");
  } else if (complex.length >= 5) {
    say("good", "Good mix of simple and complex sentences.");
  }

  if (repeated.length) {
    say("fix", `Repeated a lot: ${repeated.map(([w, c]) => `"${w}" ×${c}`).join(", ")}. Find another way to say each one at least once.`);
  }
  if (varietyPct >= 62) say("good", `${varietyPct}% of your content words are different ones — good range.`);
  else if (varietyPct < 45) say("fix", `Only ${varietyPct}% of your content words are different. The same vocabulary is going round and round.`);

  if (longSentences) say("fix", `${longSentences} sentence${longSentences === 1 ? " runs" : "s run"} past 40 words. Long is not the same as complex — split ${longSentences === 1 ? "it" : "them"}.`);
  if (informal.length >= 3) say("fix", `Informal for an academic essay: ${informal.slice(0, 4).join(", ")}. Keep the register formal.`);

  if (kind === "task1" && /\bi (think|believe|feel)\b/i.test(text)) {
    say("fix", "Task 1 has no opinion in it. Report what the chart shows and compare — never what you think of it.");
  }
  if (kind === "task1" && !/\boverall\b|\bin summary\b/i.test(text)) {
    say("fix", "There is no overview. Task 1 must state the main trend in one sentence — leaving it out caps the mark for Task Achievement.");
  }
  if (kind === "task2" && !/\bconclusion\b|\bto conclude\b|\boverall\b|\bin summary\b/i.test(text)) {
    say("fix", "No conclusion. Finish by answering the question directly in one or two sentences.");
  }

  return { words, sentences: ss.length, paragraphs: ps.length, avgSentence, varietyPct,
           linkers, repeated, longSentences, estimate, notes };
}
