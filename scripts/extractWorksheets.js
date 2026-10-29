#!/usr/bin/env node
/**
 * Grammar worksheet PDFs → structured exercise JSON.
 *
 *   node scripts/extractWorksheets.js "<folder of PDFs>" <out.json>
 *
 * ─── WHAT THIS CAN AND CANNOT DO ───────────────────────────────────
 *
 * It CAN pull out the exercises: the instruction line, each sentence,
 * and every numbered gap with the prompt that belongs to it. That part
 * is mechanical and reliable, because the worksheets are consistent
 * about writing gaps as "________(3: not to watch)".
 *
 * It CANNOT produce the answers. ⚠️  Of 323 worksheets, 310 have no
 * answer key anywhere in the file — the teacher marked them by hand in
 * class. No amount of parsing invents information that was never in
 * the document.
 *
 * So every extracted gap carries `answer: null` unless an answer strip
 * was found at the end of the PDF. An exercise with null answers is
 * written out anyway, flagged `needsAnswers: true`, because the
 * extraction is the slow part and the answers can be filled in later —
 * by the teacher, in bulk, against a list rather than 323 PDFs.
 *
 * ⚠️  DO NOT PUBLISH AN EXERCISE WITH needsAnswers: true.
 * A gap-fill that marks every attempt wrong, or marks nothing at all,
 * teaches a student that the app is broken. The website should skip
 * them until the answers exist.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function pdfText(file) {
  try {
    return execSync(`pdftotext -q -layout ${JSON.stringify(file)} -`, { maxBuffer: 1 << 26 })
      .toString()
      // Worksheets are full of non-breaking spaces and tabs from Word.
      // Left in, every answer comparison later fails on invisible
      // characters — the same class of bug as the German answer
      // checker, and just as hard to see.
      .replace(/ /g, ' ')
      .replace(/\t/g, ' ');
  } catch { return ''; }
}

/** "1 leaves 2 are you crying 3 aren't watching" → { 1:'leaves', … } */
function parseAnswerStrip(tail) {
  const out = {};
  // Numbers followed by a short run of words, repeated. Stops at the
  // next number, so multi-word answers survive.
  const re = /(?:^|\s)(\d{1,2})\s+([^\d\n]{1,40}?)(?=\s+\d{1,2}\s|\s*$)/g;
  let m;
  while ((m = re.exec(tail))) {
    const n = Number(m[1]);
    const a = m[2].trim().replace(/\s+/g, ' ');
    if (a && a.length < 40) out[n] = a;
  }
  return Object.keys(out).length >= 3 ? out : null;
}

function extract(file) {
  const raw = pdfText(file);
  if (!raw.trim()) return null;

  const answers = parseAnswerStrip(raw.slice(-1800));

  // A line with at least one gap is a question. Lines are joined where
  // a sentence wraps, because pdftotext breaks mid-sentence and a
  // half-sentence is not a usable exercise item.
  const lines = raw.split('\n').map(l => l.replace(/\s+/g, ' ').trim());
  const items = [];
  let buffer = '';

  for (const line of lines) {
    if (!line) { buffer = ''; continue; }
    const candidate = buffer ? `${buffer} ${line}` : line;
    if (/_{3,}/.test(candidate)) {
      // Complete if it ends in punctuation or a closing bracket.
      if (/[.?!)"]\s*$/.test(candidate) || candidate.length > 180) {
        items.push(candidate); buffer = '';
      } else { buffer = candidate; }
    } else {
      buffer = /[.?!]$/.test(line) ? '' : line;
    }
  }

  const questions = [];
  for (const sentence of items) {
    // Gaps as "________(3: not to watch)" or plain "________"
    const gaps = [];
    const re = /_{3,}\s*(?:\(\s*(\d+)\s*:\s*([^)]+)\)|\(([^)]+)\))?/g;
    let m, idx = 0;
    while ((m = re.exec(sentence))) {
      idx++;
      const num = m[1] ? Number(m[1]) : null;
      gaps.push({
        n: num ?? idx,
        prompt: (m[2] ?? m[3] ?? '').trim() || null,
        answer: num != null && answers ? (answers[num] ?? null) : null,
      });
    }
    if (!gaps.length) continue;
    questions.push({ text: sentence, gaps });
  }

  if (!questions.length) return null;

  const title = path.basename(file, '.pdf')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const answered = questions.flatMap(q => q.gaps).filter(g => g.answer).length;
  const totalGaps = questions.flatMap(q => q.gaps).length;

  return {
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    title,
    source: path.basename(file),
    topic: path.basename(path.dirname(file)),
    questions,
    totalGaps,
    answeredGaps: answered,
    // The flag the website must respect — see the header.
    needsAnswers: answered < totalGaps,
  };
}

function main() {
  const [dir, out] = process.argv.slice(2);
  if (!dir || !out) {
    console.error('\n  usage: node scripts/extractWorksheets.js "<folder>" <out.json>\n');
    process.exit(1);
  }

  const files = execSync(`find ${JSON.stringify(dir)} -name "*.pdf" -print0`, { maxBuffer: 1 << 28 })
    .toString().split('\0').filter(Boolean);

  const sheets = [];
  let skipped = 0;
  for (const f of files) {
    const s = extract(f);
    if (s) sheets.push(s); else skipped++;
  }

  const ready = sheets.filter(s => !s.needsAnswers);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(sheets, null, 1), 'utf8');

  const gaps = sheets.reduce((n, s) => n + s.totalGaps, 0);
  const withAns = sheets.reduce((n, s) => n + s.answeredGaps, 0);

  console.log(`\n  ${files.length} PDFs → ${out}`);
  console.log(`    worksheets extracted : ${sheets.length}`);
  console.log(`    no exercises found   : ${skipped}`);
  console.log(`    gaps total           : ${gaps}`);
  console.log(`    gaps WITH answers    : ${withAns}`);
  console.log(`    ready to publish     : ${ready.length}   (the rest need answers)\n`);
}

main();
