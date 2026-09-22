/* Give every recording a name that can never go stale.
 *
 * Until now the audio file was found by building its name out of the test id.
 * That works right up until a test is renamed — and when the two Plus sets
 * turned out to be labelled the wrong way round, every recording in storage
 * was suddenly pointing at the wrong paper, and the only fix was to upload all
 * thirteen files again by hand. That is a chore that will come back every time
 * anything is renamed, which is not acceptable for a five-second mistake.
 *
 * So the name stops being derived and starts being recorded. Each file is
 * stamped with the first eight characters of its own checksum — content, not
 * label — and the paper stores that filename verbatim. Rename the test, move
 * it between sets, call it anything: the recording keeps the name it already
 * has in the bucket and nothing has to be uploaded a second time.
 *
 * Run once:  node scripts/pin-audio.mjs .
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.argv[2] ?? ".";
const p = (...a) => path.join(ROOT, ...a);
const UP = p("supabase-upload");

const short = (file) =>
  crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex").slice(0, 8);

const rows = [];
for (const f of fs.readdirSync(UP).filter((f) => /\.mp3$/i.test(f))) {
  const id = f.replace(/\.mp3$/i, "");
  // already pinned? leave it exactly as it is — that is the whole point
  if (/-[0-9a-f]{8}$/.test(id)) { rows.push({ id: id.replace(/-[0-9a-f]{8}$/, ""), file: f }); continue; }

  const paper = p("content", "tests", `${id}.json`);
  if (!fs.existsSync(paper)) { console.log(`   skipped ${f} — no paper called ${id}`); continue; }

  const file = `${id}-${short(path.join(UP, f))}.mp3`;
  fs.renameSync(path.join(UP, f), path.join(UP, file));

  const test = JSON.parse(fs.readFileSync(paper, "utf8"));
  test.audioFile = file;          // recorded, not derived
  fs.writeFileSync(paper, JSON.stringify(test), "utf8");

  rows.push({ id, file });
  console.log(`   ${id.padEnd(6)} → ${file}`);
}

/* a plain list the teacher can check the bucket against */
const width = Math.max(...rows.map((r) => r.file.length));
fs.writeFileSync(
  p("supabase-upload", "WHAT-IS-WHAT.txt"),
  "Every recording, and the test it belongs to.\n" +
  "The long number is the file's own checksum. It never changes, so these\n" +
  "names never change either — even if a test is renamed.\n\n" +
  rows.sort((a, b) => a.id.localeCompare(b.id))
      .map((r) => `   ${r.file.padEnd(width)}   ${r.id}`).join("\n") + "\n",
  "utf8");

console.log(`\n${rows.length} recordings pinned. Upload this folder once; that is the last time.`);
