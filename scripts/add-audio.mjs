/* Drop recordings into new-audio/ named after the test, then run:
 *
 *     npm run add-audio
 *
 * Each file is re-encoded to mono 40 kbps — plenty for speech, and it takes a
 * 28 MB recording down to about 9 MB. That matters more than disk space: the
 * Supabase free plan allows 5 GB of downloads a month, so smaller files mean
 * roughly three times as many students can sit a listening test before you
 * reach the limit.
 *
 * The audio is deliberately NOT committed to git. This only puts it where the
 * site expects it, ready to upload to Supabase Storage.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const run = promisify(execFile);
const require = createRequire(import.meta.url);

/* Windows ships no ffmpeg, so the project carries its own: npm installs the
 * right binary for whichever machine you are on. Falls back to a system copy,
 * and if there is none at all the recording is still placed correctly — just
 * not made smaller. Better a large working file than a failed run. */
function tool(pkg, fallback) {
  try {
    const m = require(pkg);
    return m && m.path ? m.path : fallback;
  } catch { return fallback; }
}
const FFMPEG = tool("@ffmpeg-installer/ffmpeg", "ffmpeg");
const FFPROBE = tool("@ffprobe-installer/ffprobe", "ffprobe");

const ROOT = process.cwd();
const IN = path.join(ROOT, "new-audio");
const MEDIA = path.join(ROOT, "public", "practice", "media");
const BITRATE = "40k";

const mmss = (s) => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, "0")}s`;
const mb = (b) => (b / 1024 / 1024).toFixed(1) + " MB";

async function works(bin) {
  try { await run(bin, ["-version"]); return true; } catch { return false; }
}
async function duration(file) {
  const { stdout } = await run(FFPROBE, [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]);
  return parseFloat(stdout.trim());
}

async function main() {
  const catalogue = JSON.parse(await fs.readFile(path.join(ROOT, "content", "catalogue.json"), "utf8"));
  const listening = catalogue.filter((t) => t.mode === "listening");

  const stillMissing = async () => {
    const out = [];
    for (const t of listening) {
      try { await fs.access(path.join(MEDIA, t.id, "audio_main.mp3")); } catch { out.push(t); }
    }
    return out;
  };

  let files = [];
  try { files = await fs.readdir(IN); } catch { /* no folder yet */ }
  files = files.filter((f) => /\.(mp3|m4a|wav|aac|ogg)$/i.test(f)).sort();

  if (!files.length) {
    console.log("\nNothing to do — put your recordings in the new-audio folder first.\n");
    console.log("Name each file after the test it belongs to, for example:");
    console.log("   al-b1.mp3      al-c3.mp3\n");
    const miss = await stillMissing();
    if (miss.length) {
      console.log("Listening tests still without a recording:");
      for (const t of miss) console.log(`   ${t.id}   ${t.name}`);
    } else {
      console.log("Every listening test already has its recording.");
    }
    console.log("");
    return;
  }

  const canProbe = await works(FFPROBE);
  const canConvert = await works(FFMPEG);
  if (!canConvert) {
    console.log("\nNo audio converter available, so files will be copied unchanged.");
    console.log("They will work, but stay large. Running 'npm install' usually fixes this.");
  }
  console.log("");

  const done = [], notes = [];
  for (const f of files) {
    const base = path.basename(f).toLowerCase();
    const test = listening.find((t) => base.startsWith(t.id.toLowerCase()));
    if (!test) {
      notes.push(`${f} — the name does not start with a test id such as al-b1, so it was left alone`);
      continue;
    }

    const src = path.join(IN, f);
    const outDir = path.join(MEDIA, test.id);
    const out = path.join(outDir, "audio_main.mp3");
    await fs.mkdir(outDir, { recursive: true });

    const before = (await fs.stat(src)).size;
    const secs = canProbe ? await duration(src) : null;
    process.stdout.write(`  ${test.id}  ${secs ? mmss(secs).padEnd(8) : ""}${mb(before).padStart(9)} -> `);

    if (!canConvert) {
      await fs.copyFile(src, out);
      console.log(`${mb(before)}  copied unchanged`);
    } else {
      const tmp = out + ".tmp.mp3";
      await run(FFMPEG, ["-y", "-loglevel", "error", "-i", src,
        "-ac", "1", "-ar", "32000", "-b:a", BITRATE, tmp], { maxBuffer: 1 << 26 });

      // Never trust a re-encode blindly: the section jump buttons use timings
      // stored in the paper, so the length has to survive unchanged.
      if (canProbe && secs) {
        const after = await duration(tmp);
        if (Math.abs(after - secs) > 2) {
          await fs.rm(tmp, { force: true }).catch(() => {});
          notes.push(`${f} — length changed (${mmss(secs)} -> ${mmss(after)}); the original was left in place`);
          console.log("FAILED");
          continue;
        }
      }
      await fs.rename(tmp, out);
      const sz = (await fs.stat(out)).size;
      console.log(`${mb(sz).padStart(9)}  saved ${Math.round((1 - sz / before) * 100)}%`);
    }

    // A recording shorter than the paper's last section start is the tell-tale
    // sign that the wrong file has been dropped in.
    if (secs) {
      const paper = JSON.parse(await fs.readFile(path.join(ROOT, "content", "tests", `${test.id}.json`), "utf8"));
      const starts = paper.sectionStarts;
      if (Array.isArray(starts) && starts[starts.length - 1] > secs) {
        notes.push(`${test.id} — the paper expects a section to begin at ${mmss(starts[starts.length - 1])} but this recording is only ${mmss(secs)} long. Wrong file?`);
      }
    }
    done.push(test.id);
  }

  console.log(`\nPlaced ${done.length} recording${done.length === 1 ? "" : "s"}${done.length ? ": " + done.join(", ") : ""}`);
  if (notes.length) {
    console.log("\nWorth a look:");
    for (const n of notes) console.log("   " + n);
  }

  const miss = await stillMissing();
  console.log(miss.length
    ? `\nStill missing audio: ${miss.map((t) => t.id).join(", ")}`
    : "\nEvery listening test now has its recording.");
  console.log("\nNext: upload everything inside public/practice/media into the");
  console.log("practice-media bucket in Supabase, keeping the folder names.\n");
}

main().catch((e) => { console.error("\nFailed:", e.message, "\n"); process.exit(1); });
