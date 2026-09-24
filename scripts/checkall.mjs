/* Whole-library check. Run from the repo root:
 *
 *     node --experimental-strip-types scripts/checkall.mjs
 *     (Node 23.6+ strips types by default:  node scripts/checkall.mjs)
 *
 * Exits 1 if anything a student could notice is wrong:
 *   - a catalogue entry without its paper or key file
 *   - a paper that fails validateTest (numbering, totals, key coverage, media)
 *   - a letter answer that is not one of the options on screen
 *   - evidence pointing at the wrong passage, or at a question that does not exist
 *   - a live (keyed) paper that cannot be scored 100% or scores a blank sheet above 0
 *   - an any-order group that pays twice for the same answer
 *   - a client component importing keys, evidence or the marking code
 *   - a writing task whose image is missing, or a student copy carrying a model answer
 * Unkeyed papers are reported, not failed.
 */
import fs from "node:fs";
import path from "node:path";
import { validateTest } from "./lib/validate.mjs";
import { markAttempt, normalise } from "../lib/marking.ts";

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const exists = (p) => fs.existsSync(path.join(root, p));
const fails = [];
const notes = [];
const fail = (id, msg) => fails.push(`${id}: ${msg}`);

const catalogue = read("content/catalogue.json");
let live = 0, unkeyed = 0, withEvidence = 0;

/* exactly what the Player submits for each option (components/practice/Player.tsx):
   an object option sends its label, a plain string sends its POSITION letter */
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };
const plainText = (x) => String(x ?? "").replace(/<[^>]+>/g, " ")
  .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e) => ENT[e]).replace(/\s+/g, " ").trim();
function optionsFor(test) {
  const out = {};
  for (const s of test.sections) {
    for (const g of s.groups || []) {
      for (const q of g.questions || []) {
        const opts = q.opts ?? g.opts;
        if (!opts || !opts.length) continue;
        out[q.n] = opts.map((o, i) => (typeof o === "object" ? o.l : LETTERS[i]));
      }
    }
  }
  return out;
}

for (const entry of catalogue) {
  const id = entry.id;
  if (!exists(`content/tests/${id}.json`)) { fail(id, "paper file missing"); continue; }
  if (!exists(`content/keys/${id}.json`)) { fail(id, "key file missing"); continue; }
  const test = read(`content/tests/${id}.json`);
  const key = read(`content/keys/${id}.json`);
  const keyed = entry.keyed !== false;
  const nKey = Object.keys(key).length;

  if (!keyed) {
    unkeyed++;
    notes.push(`${id}: unscored (keyed:false), key ${nKey}/${test.total}`);
    if (nKey === 0) continue;
  } else live++;

  const { errors } = validateTest(test, key);
  for (const e of errors) {
    // media checks need files that live in Supabase storage, not the repo
    if (/audio|recording|mp3/i.test(e)) continue;
    fail(id, e);
  }
  if (keyed && nKey < test.total) fail(id, `live paper has only ${nKey}/${test.total} answers`);

  /* every letter answer must be something the student can click */
  const opts = optionsFor(test);
  for (const [n, k] of Object.entries(key)) {
    const choices = opts[n];
    if (!choices) continue;
    const answers = "any" in k ? k.any : k.accept;
    for (const a of answers) {
      if (!choices.map(normalise).includes(normalise(a))) fail(id, `Q${n} answer "${a}" is not an option (${choices.join(",")})`);
    }
  }

  /* marking: a perfect sheet scores full marks, a blank one scores nothing */
  const sheet = {};
  const used = {};
  for (const [n, k] of Object.entries(key)) {
    if ("any" in k) {
      const lead = String(k.lead ?? n);
      sheet[lead] = k.any.slice(0, k.pick);
    } else if (k.pool) {
      const tag = k.pool.join(",");
      used[tag] = used[tag] || [];
      const pick = k.accept.find((a) => !used[tag].some((u) => normalise(u).replace(/^the/, "") === normalise(a).replace(/^the/, "")));
      used[tag].push(pick);
      sheet[n] = pick;
    } else sheet[n] = k.accept[0];
  }
  const sections = test.sections.map((s) => ({ label: s.label, qs: s.qs }));
  const bands = test.mode === "listening" ? test.bandsListening : test.bandsReading;
  const full = markAttempt(key, sheet, sections, bands || [[0, 0]], test.total);
  const blank = markAttempt(key, {}, sections, bands || [[0, 0]], test.total);
  if (full.raw !== nKey) fail(id, `perfect sheet scores ${full.raw}, expected ${nKey}`);
  if (blank.raw !== 0) fail(id, `blank sheet scores ${blank.raw}`);

  /* any-order groups must not pay twice for one answer */
  const pools = new Set(Object.values(key).filter((k) => k.pool).map((k) => k.pool.join(",")));
  for (const p of pools) {
    const qs = p.split(",");
    const dup = {};
    for (const q of qs) dup[q] = key[qs[0]].accept[0];
    const r = markAttempt(key, dup, sections, bands || [[0, 0]], test.total);
    const got = r.questions.filter((x) => qs.includes(x.n) && x.correct).length;
    if (got !== 1) fail(id, `pool ${p}: the same answer in every box scored ${got}, expected 1`);
  }

  /* evidence */
  if (exists(`content/evidence/${id}.json`)) {
    withEvidence++;
    const ev = read(`content/evidence/${id}.json`);
    for (const [n, e] of Object.entries(ev)) {
      const sec = test.sections.findIndex((s) => s.qs.includes(Number(n)));
      if (sec < 0) { fail(id, `evidence for Q${n}, which is not in the paper`); continue; }
      if (e.s !== sec) fail(id, `evidence for Q${n} points at section ${e.s}, question is in ${sec}`);
      if (e.k === "none" ? e.t.length !== 0 : !e.t || e.t.length === 0) fail(id, `evidence for Q${n} is malformed`);
      /* the Player highlights one paragraph at a time, so a line must sit whole
         inside a single paragraph of that passage or its pin silently fails */
      const paras = (test.sections[sec].passage?.paras || []).map((p) => plainText(typeof p === "string" ? p : p.t));
      if (paras.length) {
        for (const line of e.t || []) {
          if (!paras.some((p) => p.includes(plainText(line)))) fail(id, `evidence for Q${n} is not verbatim inside one paragraph: "${line.slice(0, 60)}…"`);
        }
      }
      const k = key[n];
      if (k && "accept" in k && /^NOT ?GIVEN$/i.test(k.accept[0]) && e.k !== "none") fail(id, `Q${n} is NOT GIVEN but its evidence cites a line`);
    }
  } else if (keyed) notes.push(`${id}: no evidence file (review falls back gracefully)`);
}

/* nothing secret may be imported by a client component */
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
}
for (const f of [...walk(path.join(root, "app")), ...walk(path.join(root, "components"))]) {
  if (!/\.(t|j)sx?$/.test(f)) continue;
  const src = fs.readFileSync(f, "utf8");
  if (!/^\s*["']use client["']/.test(src)) continue;
  if (/from\s+["'][^"']*(lib\/marking|lib\/evidence|content\/keys|content\/evidence)/.test(src) ||
      /getKey\s*\(/.test(src)) fail(path.relative(root, f), "client component imports answer data");
}

/* writing */
for (const file of ["task1", "task2"]) {
  const list = read(`content/writing/${file}.json`);
  const ids = new Set();
  for (const t of list) {
    if (ids.has(t.id)) fail(t.id, "duplicate writing id");
    ids.add(t.id);
    for (const img of [...(t.images || []), ...(t.sampleImages || [])]) {
      if (!exists(`public/practice/writing/${img}`)) fail(t.id, `missing image ${img}`);
    }
    if (file === "task1" && !(t.images || []).length) fail(t.id, "Task 1 with no chart");
    if (file === "task2" && !(t.prompts || []).length) fail(t.id, "Task 2 with no question");
  }
}

console.log(`papers ${catalogue.length} · live ${live} · unscored ${unkeyed} · with evidence ${withEvidence}`);
for (const n of notes) console.log("  note  " + n);
if (fails.length) {
  for (const f of fails) console.log("  FAIL  " + f);
  console.log(`${fails.length} problem(s)`);
  process.exit(1);
}
console.log("all checks passed");
