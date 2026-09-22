/* X1 was a placeholder, and a placeholder has no business on a student's screen.
 * The set pairs with P2 and the centre's own shorthand is p1t1, so it becomes P1.
 * Nothing about the recordings moves: each one is pinned to its own checksum. */
import fs from "node:fs";
import path from "node:path";
const ROOT = process.argv[2];
const p = (...a) => path.join(ROOT, ...a);

const cat = JSON.parse(fs.readFileSync(p("content", "catalogue.json"), "utf8"));
for (const row of cat) {
  if (!row.id.startsWith("x1")) continue;
  const to = "p1" + row.id.slice(2);
  for (const dir of ["tests", "keys"]) {
    const a = p("content", dir, `${row.id}.json`);
    if (fs.existsSync(a)) fs.renameSync(a, p("content", dir, `${to}.json`));
  }
  const dir = p("public", "practice", "media", row.id);
  if (fs.existsSync(dir)) fs.renameSync(dir, p("public", "practice", "media", to));

  const file = p("content", "tests", `${to}.json`);
  const test = JSON.parse(fs.readFileSync(file, "utf8"));
  const was = test.id;
  test.id = to;
  test.name = `${to.toUpperCase()} — ${row.label}`;
  test.catalogue = { ...test.catalogue, id: to, set: "P1" };
  if (test.mediaUrls) for (const k of Object.keys(test.mediaUrls))
    test.mediaUrls[k] = String(test.mediaUrls[k]).replace(`/practice/media/${was}/`, `/practice/media/${to}/`);
  fs.writeFileSync(file, JSON.stringify(test), "utf8");

  console.log(`  ${row.id.padEnd(6)} → ${to.padEnd(6)} P1  ${test.audioFile ?? ""}`);
  row.id = to; row.set = "P1"; row.name = test.name;
}
fs.writeFileSync(p("content", "catalogue.json"), JSON.stringify(cat, null, 1), "utf8");
