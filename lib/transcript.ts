/**
 * The timed transcript of a listening paper, answers marked.
 *
 * SERVER ONLY, for the same reason as lib/evidence: it contains every answer
 * word for word. It is read on the server and attached to a result only after
 * the paper has been marked — never sent with the test itself.
 *
 * content/transcripts/<id>.json — made by scripts/extract-transcripts.py
 */
import fs from "node:fs/promises";
import path from "node:path";
import { currentId } from "./aliases";

export type Transcript = {
  sections: { lines: { at: number; p: (string | { q: string; t: string })[] }[] }[];
};

export async function getTranscript(wanted: string): Promise<Transcript | null> {
  if (!/^[a-z0-9-]+$/.test(wanted)) return null;
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "transcripts", `${currentId(wanted)}.json`), "utf8");
    const t = JSON.parse(raw) as Transcript;
    return t && Array.isArray(t.sections) ? t : null;
  } catch {
    return null;
  }
}
