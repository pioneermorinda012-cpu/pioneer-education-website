/**
 * Where, exactly, each answer lives in the passage.
 *
 * SERVER ONLY. This is as good as the answer key: on a gap-fill the evidence
 * sentence contains the answer word for word, so a student who could read this
 * file before submitting would not need to read the passage. It is loaded on
 * the server and only ever attached to a result that has already been marked.
 *
 * The site used to work this out for itself, by searching the passage for the
 * words of the correct answer. That is sound for a gap-fill — the answer IS a
 * phrase from the passage — and useless for everything else, because the answer
 * to a True/False or a multiple choice is a letter and the letter appears
 * nowhere. Those fell through to an AI route: slow, billed per question, and
 * dependent on a database table that does not exist in production, which is why
 * explanations have been returning 502.
 *
 * A person writing the paper already knows which sentence the question came
 * from. Writing it down once, when the paper is made, is faster than any model
 * and cannot be wrong. content/evidence/<id>.json holds that, keyed by question
 * number:
 *
 *     { "7": { "s": 0, "t": ["to avoid spillage of the liquid…"] } }
 *
 *  s  which section's passage the sentence is in
 *  t  the sentence itself, verbatim — more than one when an answer rests on
 *     two separate lines
 *
 * A paper with no such file behaves exactly as before, so nothing that works
 * today stops working. Papers gain the marks as they are authored.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { currentId } from "./aliases";

/**
 * s  which section's passage
 * t  the sentence itself, verbatim — empty when there deliberately isn't one
 * k  how it is known, absent on a paper a teacher marked up by hand:
 *      "exact" the answer is that phrase, so this cannot be wrong
 *      "near"  the closest line, found by wording — usually right, not certain
 *      "none"  NOT GIVEN: there is no such line, and that is the answer
 */
export type Evidence = Record<
  string,
  { s: number; t: string[]; k?: "exact" | "near" | "none" }
>;

const CONTENT = path.join(process.cwd(), "content");

export async function getEvidence(wanted: string): Promise<Evidence> {
  if (!/^[a-z0-9-]+$/.test(wanted)) return {};
  const id = currentId(wanted);
  try {
    const raw = await fs.readFile(path.join(CONTENT, "evidence", `${id}.json`), "utf8");
    const parsed = JSON.parse(raw) as Evidence;
    // Never let a malformed file take a student's result down with it: the
    // score is the thing that matters, the highlighting is the bonus.
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
