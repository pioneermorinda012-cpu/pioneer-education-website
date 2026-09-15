/* Drop MP3s into new-audio/ named after the test, then run:  npm run add-audio
 *
 * Each file is re-encoded to mono 40 kbps, which is plenty for speech and cuts
 * a 28 MB recording to about 9 MB. That matters: Supabase's free plan allows
 * 5 GB of downloads a month, so smaller files mean roughly three times as many
 * students can sit a listening test before you hit the limit.
 *
 * The audio is NOT committed to git — it is far too large. This only places it
 * correctly so you can upload the whole media folder to Supabase Storage.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const run = promisify(execFile);
const ROOT = process.cwd();
const IN = path.join(ROOT, "new-audio");
const MEDIA = path.join(ROOT, "public", "practice", "media");
const BITRATE = "40k";

const mmss = (s) => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, "0")}s`;
const mb = (b) => (b / 1024 / 1024).toFixed(1) + " MB";

async function duration(file) {
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]);
  return parseFloat(stdout.trim());
}

async function main() {
  const catalogue = JSON.parse(await fs.readFile(path.join(ROOT, "content", "catalogue.json"), "utf8"));
  const listening = catalogue.filter((t) => t.mode === "listening");

  let files = [];
  try { files = await fs.readdir(IN); } catch { /* folder missing */ }
  files = files.filter((f) => /\.(mp3|m4a|wav|aac|ogg)$/i.test(f));

  if (!files.length) {
    console.log("\nNothing to do. Put your recordings in the new-audio folder first.\n");
    console.log("Name each file after the test it belongs to, for example:");
    console.log("   al-b1.mp3      al-c3.mp3\n");
    console.log("Listening tests still without audio:");
    for (const t of listening) {
      const target = path.join(MEDIA, t.id, "audio_main.mp3");
      try { await fs.access(target); } catch { console.log(`   ${t.id}   ${t.name}`); }
    }
    console.log("");
    return;
  }

  const done = [], skipped = [];
  for (const f of files) {
    const base = path.basename(f).toLowerCase();
    const test = listening.find((t) => base.startsWith(t.id.toLowerCase()));
    if (!test) {
      skipped.push(`${f} — the name does not start with a test id such as al-b1`);
      continue;
    }

    const src = path.join(IN, f);
    const outDir = path.join(MEDIA, test.id);
    const out = path.join(outDir, "audio_main.mp3");
    await fs.mkdir(outDir, { recursive: true });

    const before = (await fs.stat(src)).size;
    const secs = await duration(src);

    process.stdout.write(`  ${test.id}  ${mmss(secs)}  ${mb(before)} → `);
    const tmp = out + ".tmp.mp3";
    await run("ffmpeg", [
      "-y", "-loglevel", "error", "-i", src,
      "-ac", "1", "-ar", "32000", "-b:a", BITRATE, tmp,
    ], { maxBuffer: 1 << 26 });

    // Never trust a re-encode blindly: the section jump buttons rely on the
    // timings in the paper, so the length must survive unchanged.
    const after = await duration(tmp);
    if (Math.abs(after - secs) > 2) {
      await fs.rm(tmp, { force: true });
      skipped.push(`${f} — length changed (${mmss(secs)} → ${mmss(after)}), left alone`);
      console.log("FAILED");
      continue;
    }
    await fs.rename(tmp, out);
    const sz = (await fs.stat(out)).size;
    console.log(`${mb(sz)}   saved ${Math.round((1 - sz / before) * 100)}%`);

    const starts = test.id && JSON.parse(
      await fs.readFile(path.join(ROOT, "content", "tests", `${test.id}.json`), "utf8"),
    ).sectionStarts;
    if (Array.isArray(starts) && starts[starts.length - 1] > secs) {
      skipped.push(`${test.id} — the paper expects a section to start at ${mmss(starts[starts.length - 1])} but the recording is only ${mmss(secs)}. Wrong recording?`);
    }
    done.push(test.id);
  }

  console.log(`\nPlaced ${done.length} recording${done.length === 1 ? "" : "s"}: ${done.join(", ") || "none"}`);
  if (skipped.length) {
    console.log("\nNeeds your attention:");
    for (const s of skipped) console.log("   " + s);
  }

  const missing = [];
  for (const t of listening) {
    try { await fs.access(path.join(MEDIA, t.id, "audio_main.mp3")); } catch { missing.push(t.id); }
  }
  console.log(missing.length
    ? `\nStill missing audio: ${missing.join(", ")}`
    : "\nEvery listening test now has its recording.");
  console.log("\nNext: upload the contents of public/practice/media into the");
  console.log("practice-media bucket in Supabase, keeping the folder names.\n");
}

main().catch((e) => { console.error("\nFailed:", e.message, "\n"); process.exit(1); });
