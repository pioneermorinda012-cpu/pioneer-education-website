/* Put the two Plus sets the right way round.
 *
 * The set coded P1 is IELTS Plus 2. That is not a guess: the Plus 2 answer
 * sheet fits it and only it. Every letter answer falls inside that paper's
 * options, every written answer lands on a gap to write in — 100% on all four
 * listening papers and all five reading papers, and 22–44% against the set
 * coded P2, which is what a wrong sheet looks like. The Plus 2 sheet also has a
 * Test 2 listening with no paper to match, and this set is missing exactly
 * Test 2. So P1 becomes P2.
 *
 * What was coded P2 is some other book, still unidentified, so it takes a
 * holding code — X1 — rather than a name nobody has checked. It keeps its
 * papers, its audio and its place in the library; only the label is honest now.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv[2];
const p = (...a) => path.join(ROOT, ...a);

/* one hop through a temporary name, because the two sets swap into each
 * other's places and a direct rename would overwrite the file it is reading */
const PLUS2 = ["p1l1", "p1l3", "p1l4", "p1l5", "p1r1", "p1r2", "p1r3", "p1r4", "p1r5"];
const OTHER = ["p2l1", "p2l2", "p2l3", "p2l4", "p2l5",
               "p2r1", "p2r2", "p2r3", "p2r4", "p2r5", "p2r6"];

const FINAL = {};
for (const id of PLUS2) FINAL[id] = "p2" + id.slice(2);   // p1r3 -> p2r3
for (const id of OTHER) FINAL[id] = "x1" + id.slice(2);   // p2r3 -> x1r3
const SET_OF = (id) => (id.startsWith("p2") ? "P2" : "X1");

const tmp = (id) => "zz" + id;
const moveDir = (from, to) => { if (fs.existsSync(from)) fs.renameSync(from, to); };

function pass(map) {
  for (const [from, to] of Object.entries(map)) {
    for (const dir of ["tests", "keys"]) {
      const a = p("content", dir, `${from}.json`);
      if (fs.existsSync(a)) fs.renameSync(a, p("content", dir, `${to}.json`));
    }
    moveDir(p("public", "practice", "media", from), p("public", "practice", "media", to));
    moveDir(p("supabase-upload", `${from}.mp3`), p("supabase-upload", `${to}.mp3`));
  }
}

// hop out of the way, then into place
pass(Object.fromEntries(Object.keys(FINAL).map((k) => [k, tmp(k)])));
pass(Object.fromEntries(Object.entries(FINAL).map(([k, v]) => [tmp(k), v])));

/* rewrite what is inside each paper, and rebuild the catalogue from them */
const cat = JSON.parse(fs.readFileSync(p("content", "catalogue.json"), "utf8"));
for (const row of cat) {
  const to = FINAL[row.id];
  if (!to) continue;
  row.id = to;
  row.set = SET_OF(to);
  row.name = `${to.toUpperCase()} — ${row.label}`;
  row.keyed = (() => {
    try { return Object.keys(JSON.parse(fs.readFileSync(p("content", "keys", `${to}.json`), "utf8"))).length > 0; }
    catch { return false; }
  })();

  const file = p("content", "tests", `${to}.json`);
  const test = JSON.parse(fs.readFileSync(file, "utf8"));
  const was = test.id;
  test.id = to;
  test.name = row.name;
  test.catalogue = { ...test.catalogue, id: to, set: row.set };
  if (test.mediaUrls) {
    for (const k of Object.keys(test.mediaUrls)) {
      test.mediaUrls[k] = String(test.mediaUrls[k])
        .replace(`/practice/media/${was}/`, `/practice/media/${to}/`);
    }
  }
  fs.writeFileSync(file, JSON.stringify(test), "utf8");
  console.log(`  ${was.padEnd(6)} → ${to.padEnd(6)} ${row.set}  ${row.keyed ? "keyed" : "key pending"}`);
}
fs.writeFileSync(p("content", "catalogue.json"), JSON.stringify(cat, null, 1), "utf8");
