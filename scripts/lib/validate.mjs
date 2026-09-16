/* Everything that must be true before a paper goes anywhere near a student.
 *
 * This matters more than clever conversion. A test that fails to import is a
 * nuisance; a test that imports wrongly marks a correct answer wrong, and the
 * student believes the machine over themselves. So nothing is written unless
 * it passes every check here.
 */

export function validateTest(test, key) {
  const errors = [], warnings = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };
  const note = (cond, msg) => { if (!cond) warnings.push(msg); };

  if (!test || typeof test !== "object") return { errors: ["the paper is not an object"], warnings };

  need(typeof test.name === "string" && test.name.trim(), "the paper has no name");
  need(test.mode === "reading" || test.mode === "listening",
    `mode must be "reading" or "listening", not ${JSON.stringify(test.mode)}`);
  need(Number.isFinite(test.minutes) && test.minutes > 0, "minutes must be a positive number");
  need(Array.isArray(test.sections) && test.sections.length > 0, "the paper has no sections");
  if (errors.length) return { errors, warnings };

  /* ---- question numbers ---- */
  const all = [];
  test.sections.forEach((s, i) => {
    need(Array.isArray(s.qs) && s.qs.length,
      `section ${i + 1} ("${s.label ?? "?"}") lists no question numbers`);
    (s.qs || []).forEach((n) => all.push(n));
  });
  if (errors.length) return { errors, warnings };

  const sorted = [...all].sort((a, b) => a - b);
  const dupes = [...new Set(sorted.filter((n, i) => i && n === sorted[i - 1]))];
  need(!dupes.length, `question ${dupes.join(", ")} appears in more than one section`);

  need(test.total === all.length,
    `the paper says total ${test.total} but the sections contain ${all.length} questions`);

  need(sorted[0] === 1, `question numbers should start at 1, not ${sorted[0]}`);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      errors.push(`question numbers jump from ${sorted[i - 1]} to ${sorted[i]} — one is missing`);
      break;
    }
  }

  /* ---- audio ---- */
  if (test.mode === "listening") {
    need(test.audioId && test.mediaUrls && test.mediaUrls[test.audioId],
      "a listening paper needs an audioId pointing at a file in mediaUrls");
    if (Array.isArray(test.sectionStarts)) {
      need(test.sectionStarts.length === test.sections.length,
        `${test.sectionStarts.length} section start times for ${test.sections.length} sections`);
      for (let i = 1; i < test.sectionStarts.length; i++) {
        need(test.sectionStarts[i] > test.sectionStarts[i - 1],
          `section start times must increase: ${test.sectionStarts[i - 1]} then ${test.sectionStarts[i]}`);
      }
    } else {
      warnings.push("no section start times, so the jump buttons will not appear");
    }
  }

  const bands = test.mode === "reading" ? test.bandsReading : test.bandsListening;
  need(Array.isArray(bands) && bands.length > 0, "no band conversion table");

  /* ---- the answer key ---- */
  if (!key || typeof key !== "object" || !Object.keys(key).length) {
    warnings.push("no answer key, so this shows as 'Answer key pending' and cannot be marked");
  } else {
    const missing = sorted.filter((n) => key[String(n)] === undefined);
    need(!missing.length, missing.length > 6
      ? `the key is missing ${missing.length} questions (${missing.slice(0, 6).join(", ")} …)`
      : `the key is missing question ${missing.join(", ")}`);

    const extra = Object.keys(key).filter((k) => !sorted.includes(Number(k)));
    note(!extra.length, `the key answers questions not in the paper: ${extra.join(", ")}`);

    for (const n of sorted) {
      const k = key[String(n)];
      if (k === undefined) continue;
      const ok = (k && Array.isArray(k.accept) && k.accept.length) ||
                 (k && Array.isArray(k.any) && k.any.length);
      need(ok, `question ${n} has an empty answer`);
    }
  }

  /* ---- images referenced but not supplied ---- */
  const refs = new Set();
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === "object") {
      if (typeof o.img === "string") refs.add(o.img);
      Object.values(o).forEach(walk);
    }
  };
  walk(test.sections);
  for (const r of refs) {
    note(test.mediaUrls && test.mediaUrls[r],
      `the paper shows an image "${r}" that is not listed in mediaUrls`);
  }

  return { errors, warnings };
}

export function report(id, { errors, warnings }) {
  const line = (s) => console.log("     " + s);
  if (errors.length) {
    console.log(`  ${id}  REJECTED — nothing was written`);
    errors.forEach((e) => line("error:   " + e));
    warnings.forEach((w) => line("warning: " + w));
    return false;
  }
  console.log(`  ${id}  ok`);
  warnings.forEach((w) => line("warning: " + w));
  return true;
}
