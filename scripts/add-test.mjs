/* Install a new test into the site.
 *
 *     npm run add-test
 *
 * Put the files in new-tests/ and run it. Everything is checked before
 * anything is written: a paper that does not add up is rejected whole rather
 * than half-installed, because a test that marks a right answer wrong is far
 * worse than a test that refuses to load.
 *
 * What it accepts, per test:
 *   <id>.json            the paper           (required)
 *   <id>.key.json        the answer key      (optional — without it the test
 *                                             shows as "Answer key pending")
 *   <id>.mp3             the recording       (listening only)
 *   <id>.<name>.png|jpg  any diagrams
 *
 * The id decides where it lands in the library: al-* Academic Listening,
 * ar-* Academic Reading, gl-* GT Listening, gr-* GT Reading.
 *
 * A Word or PDF paper cannot be turned into a test automatically with any
 * confidence — IELTS papers use eighteen different question layouts and a
 * wrong guess costs a student marks. Drop one in and this will extract the
 * text beside it so you can send that to Claude, which is far quicker than
 * sending the document itself.
 */
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { validateTest, report } from "./lib/validate.mjs";

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const IN = path.join(ROOT, "new-tests");
const CONTENT = path.join(ROOT, "content");
const MEDIA = path.join(ROOT, "public", "practice", "media");

const SKILLS = {
  al: { code: "AL", label: "Academic Listening", mode: "listening" },
  ar: { code: "AR", label: "Academic Reading", mode: "reading" },
  gl: { code: "GL", label: "GT Listening", mode: "listening" },
  gr: { code: "GR", label: "GT Reading", mode: "reading" },
};

const exists = async (p) => { try { await fs.access(p); return true; } catch { return false; } };

async function extractWords(file, outTxt) {
  let mammoth;
  try { mammoth = require("mammoth"); } catch { return false; }
  const { value } = await mammoth.extractRawText({ path: file });
  await fs.writeFile(outTxt, value, "utf8");
  return true;
}

async function main() {
  if (!(await exists(IN))) {
    console.log(`\nNo new-tests folder. Create it and put your files there.\n`);
    return;
  }
  const files = (await fs.readdir(IN)).filter((f) => !f.startsWith("."));
  const papers = files.filter((f) => /\.json$/i.test(f) && !/\.key\.json$/i.test(f));

  const docs = files.filter((f) => /\.(docx|pdf)$/i.test(f));
  for (const d of docs) {
    const out = path.join(IN, d.replace(/\.(docx|pdf)$/i, ".txt"));
    if (/\.docx$/i.test(d) && !(await exists(out))) {
      const ok = await extractWords(path.join(IN, d), out);
      console.log(ok
        ? `  ${d} — text pulled out into ${path.basename(out)}; send that to Claude to build the test`
        : `  ${d} — could not read it; run "npm install" and try again`);
    } else if (/\.pdf$/i.test(d)) {
      console.log(`  ${d} — PDFs cannot be read here; send the file to Claude`);
    }
  }

  if (!papers.length) {
    console.log(docs.length ? "" : "\nNothing to install.\n");
    console.log("Put a paper in new-tests as <id>.json — for example ar-a5.json —");
    console.log("with its answers as ar-a5.key.json beside it.\n");
    return;
  }

  const catalogue = JSON.parse(await fs.readFile(path.join(CONTENT, "catalogue.json"), "utf8"));
  const installed = [], rejected = [];

  for (const f of papers) {
    const id = f.replace(/\.json$/i, "");
    if (!/^[a-z]{2}-[a-z0-9]+$/.test(id)) {
      rejected.push(`${f} — the name must look like ar-a5.json`);
      continue;
    }
    const skill = SKILLS[id.slice(0, 2)];
    if (!skill) {
      rejected.push(`${f} — "${id.slice(0, 2)}" is not a skill. Use al, ar, gl or gr.`);
      continue;
    }

    let test, key = null;
    try { test = JSON.parse(await fs.readFile(path.join(IN, f), "utf8")); }
    catch (e) { rejected.push(`${f} — not valid JSON: ${e.message}`); continue; }
    const keyFile = path.join(IN, `${id}.key.json`);
    if (await exists(keyFile)) {
      try { key = JSON.parse(await fs.readFile(keyFile, "utf8")); }
      catch (e) { rejected.push(`${id}.key.json — not valid JSON: ${e.message}`); continue; }
    }

    /* fill in what the site needs and the author should not have to repeat */
    test.id = id;
    test.mode = test.mode || skill.mode;
    test.catalogue = { ...(test.catalogue || {}), id, skill: skill.code, skillLabel: skill.label };
    test.mediaUrls = test.mediaUrls || {};

    const media = files.filter((x) => x.startsWith(id + ".") && /\.(mp3|png|jpg|jpeg|svg)$/i.test(x));
    for (const m of media) {
      const ext = path.extname(m).toLowerCase();
      const name = ext === ".mp3" ? "audio_main" : m.slice(id.length + 1).replace(/\.[^.]+$/, "");
      const file = ext === ".mp3" ? "audio_main.mp3" : name + ext;
      test.mediaUrls[ext === ".mp3" ? "audio_main" : name] = `/practice/media/${id}/${file}`;
      if (ext === ".mp3") test.audioId = "audio_main";
    }

    const result = validateTest(test, key);
    if (!report(id, result)) { rejected.push(id); continue; }

    /* only now does anything touch the site */
    await fs.mkdir(path.join(CONTENT, "tests"), { recursive: true });
    await fs.mkdir(path.join(CONTENT, "keys"), { recursive: true });
    await fs.writeFile(path.join(CONTENT, "tests", `${id}.json`), JSON.stringify(test), "utf8");
    await fs.writeFile(path.join(CONTENT, "keys", `${id}.json`), JSON.stringify(key || {}, null, 1), "utf8");

    if (media.length) {
      await fs.mkdir(path.join(MEDIA, id), { recursive: true });
      for (const m of media) {
        const ext = path.extname(m).toLowerCase();
        const file = ext === ".mp3" ? "audio_main.mp3" : m.slice(id.length + 1);
        await fs.copyFile(path.join(IN, m), path.join(MEDIA, id, file));
      }
      console.log(`     ${media.length} media file${media.length === 1 ? "" : "s"} copied`);
    }

    const entry = {
      id, skill: skill.code, skillLabel: skill.label,
      set: test.catalogue.set || `Pioneer ${skill.code} Set`,
      label: test.catalogue.label || id.toUpperCase(),
      order: test.catalogue.order ?? 99,
      name: test.name, minutes: test.minutes, total: test.total,
      mode: test.mode, sections: test.sections.length,
      keyed: Boolean(key && Object.keys(key).length),
    };
    const at = catalogue.findIndex((c) => c.id === id);
    if (at >= 0) catalogue[at] = entry; else catalogue.push(entry);
    installed.push(id);
  }

  if (installed.length) {
    await fs.writeFile(path.join(CONTENT, "catalogue.json"), JSON.stringify(catalogue, null, 1), "utf8");
  }

  console.log(`\nInstalled ${installed.length}${installed.length ? ": " + installed.join(", ") : ""}`);
  if (rejected.length) {
    console.log("\nNot installed:");
    rejected.forEach((r) => console.log("   " + r));
  }
  if (installed.length) {
    console.log("\nNext:");
    console.log("   git add -A content public/practice");
    console.log('   git commit -m "Add ' + installed.join(", ") + '"');
    console.log("   git push origin main");
    const withAudio = installed.filter((id) => SKILLS[id.slice(0, 2)].mode === "listening");
    if (withAudio.length) {
      console.log("\n   Then upload public/practice/media into the practice-media bucket in Supabase.");
    }
  }
  console.log("");
}

main().catch((e) => { console.error("\nFailed:", e.message, "\n"); process.exit(1); });
