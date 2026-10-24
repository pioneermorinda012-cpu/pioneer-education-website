/**
 * Instant feedback on a piece of writing.
 *
 * This is not a band score and it does not pretend to be one. No program can
 * read an argument and judge whether it convinces; what a program can do is
 * count the things students lose easy marks on and that a teacher would
 * otherwise spend the first ten minutes of every lesson pointing out — too
 * short, one wall of text, the same six linking words, "I think" eleven times.
 * Those are worth catching in the thirty seconds after writing, while the essay
 * is still in the student's head.
 *
 * Everything here is deterministic and runs in the browser, so a student can
 * write and get an answer with no key, no network and no waiting. The estimate
 * is labelled as a guide throughout, and the teacher's mark is what counts.
 */

const STOP = new Set(
  ("the a an and or but if of to in on at for with as by from is are was were be been being this " +
   "that these those it its i you he she we they my your his her our their not no so very can " +
   "could will would should may might do does did have has had there here them him us me").split(" "));

const LINKERS = ["however", "moreover", "furthermore", "in addition", "additionally", "on the other hand",
  "therefore", "consequently", "as a result", "for example", "for instance", "in conclusion", "to conclude",
  "overall", "in summary", "firstly", "secondly", "finally", "in contrast", "despite", "although", "while",
  "whereas", "nevertheless", "nonetheless", "besides", "similarly", "likewise", "thus", "hence"];

/** Letters link ideas less formally than essays; these count for a GT letter too. */
const LETTER_LINKERS = ["also", "as well as", "apart from", "as for", "in particular", "best of all",
  "what's more", "on top of that", "first of all", "to begin with", "after that", "then", "anyway",
  "by the way", "in fact", "unfortunately", "fortunately", "so", "because", "as soon as", "otherwise"];

const COMPLEX = ["because", "although", "though", "while", "whereas", "if", "unless", "since", "which",
  "who", "whom", "that", "whenever", "wherever", "despite", "in spite of", "even though", "provided that"];
/** A chart report builds its complex sentences differently: "followed by…",
    "accounting for…", "…, rising to…" (the owner's list for Academic Task 1). */
const REPORT_COMPLEX = ["whose", "where", "when", "before", "after", "until", "followed by", "accounting for",
  "compared with", "making", "becoming"];

/** Words a student leans on when they are not sure what else to say. */
const INFORMAL = ["a lot of", "lots of", "kids", "stuff", "things", "nowadays a lot", "big", "good", "bad",
  "very very", "etc", "and so on", "i think that", "in my opinion i"];

export type Note = { kind: "good" | "fix"; text: string };

/**
 * What one GT letter asks for, written by the teacher with the task: the
 * bullet points and words that show each one was answered, the greeting and
 * sign-off that letter needs, and whether it is formal or informal. Patterns
 * are regular-expression source strings, matched without regard to case.
 */
export type LetterCheck = {
  bullets: { label: string; kw: string[] }[];
  greetRe: string; greetShow: string;
  closeRe: string; closeShow: string;
  tone: "formal" | "informal";
  /** Academic Task 1: the bullets are the chart's key features, and the
      question text is kept so an introduction copied from it can be spotted. */
  academic?: boolean;
  prompt?: string;
  /** Academic Task 1: the chart's own labels, which a report cannot avoid repeating. */
  topic?: string[];
  /** Academic Task 1 process or cycle diagram: no figures to report, so the
      check looks for sequence words instead, and the bullets are its stages.
      `natural` (a life cycle, the water cycle) relaxes the passive check. */
  process?: boolean;
  natural?: boolean;
  /** Academic Task 1 map or plan: changes and locations, not figures. */
  map?: boolean;
};

/** Words that put the stages of a process in order. */
const SEQUENCE = ["first", "firstly", "first of all", "to begin with", "initially", "at the beginning", "then",
  "next", "after this", "after that", "after which", "following this", "following that", "following which",
  "afterwards", "subsequently", "once", "when", "before", "until", "after", "at this stage", "in the next stage",
  "in the following stage", "in the final stage", "in the first stage", "at the next stage", "finally",
  "eventually", "ultimately", "lastly", "meanwhile", "at the same time", "during this time"];

/** Misspellings students actually make, with the spelling they meant. */
const SPELL: Record<string, string> = {
  recieve: "receive", recieved: "received", definately: "definitely", definetly: "definitely",
  untill: "until", wich: "which", beleive: "believe", adress: "address", accomodation: "accommodation",
  neccessary: "necessary", necesary: "necessary", tommorow: "tomorrow", tomorow: "tomorrow",
  sincerly: "sincerely", faithfuly: "faithfully", faithfull: "faithfully", oppurtunity: "opportunity",
  oportunity: "opportunity", enviroment: "environment", goverment: "government", freind: "friend",
  frend: "friend", wierd: "weird", occured: "occurred", begining: "beginning", writting: "writing",
  alot: "a lot", becuase: "because", beacuse: "because", bcoz: "because", bcz: "because",
  thier: "their", truely: "truly", realy: "really", comming: "coming", arguement: "argument",
  buisness: "business", calender: "calendar", collegue: "colleague", completly: "completely",
  dissapointed: "disappointed", embarass: "embarrass", existance: "existence", familar: "familiar",
  finaly: "finally", foward: "forward", grammer: "grammar", happend: "happened",
  immediatly: "immediately", independant: "independent", knowlege: "knowledge", libary: "library",
  noticable: "noticeable", occassion: "occasion", prefered: "preferred", problom: "problem",
  probelm: "problem", recomend: "recommend", refered: "referred", responsable: "responsible",
  sucessful: "successful", succesful: "successful", suprise: "surprise", transfered: "transferred",
  unfortunatly: "unfortunately", unfortunetly: "unfortunately", wether: "whether", whould: "would",
  didnt: "didn't", doesnt: "doesn't", isnt: "isn't", wasnt: "wasn't", havent: "haven't",
  couldnt: "couldn't", dont: "don't", cant: "can't", ur: "your", u: "you", pls: "please",
  plz: "please", statment: "statement", purchse: "purchase", purchace: "purchase",
  transection: "transaction", transcation: "transaction", managment: "management",
  schedual: "schedule", shedule: "schedule", programe: "programme", experiance: "experience",
  experince: "experience", intrested: "interested", intersted: "interested", nieghbour: "neighbour",
  beautifull: "beautiful", beatiful: "beautiful", spacous: "spacious", kitchan: "kitchen",
  garaje: "garage", reliabilty: "reliability", relaible: "reliable", availabe: "available",
  inconvinience: "inconvenience", convinient: "convenient", apreciate: "appreciate",
  greatful: "grateful", regrads: "regards", reguards: "regards",
};

/** Grammar slips common enough to catch by pattern: [pattern, what it is, the fix]. */
const SLIPS: [RegExp, string, string][] = [
  [/\bi am agree\b/i, "I am agree", "I agree"],
  [/\bmore better\b/i, "more better", "better"],
  [/\bdiscuss about\b/i, "discuss about", "discuss"],
  [/\breturn back\b/i, "return back", "return"],
  [/\binformations\b/i, "informations", "information"],
  [/\badvices\b/i, "advices", "advice"],
  [/\bfurnitures\b/i, "furnitures", "furniture"],
  [/\bequipments\b/i, "equipments", "equipment"],
  [/\ban university\b/i, "an university", "a university"],
  [/\ba (apple|hour|honest|email|area|office|appointment|issue|amount|event|extra|unauthori[sz]ed|account|employee|idea)\b/i,
    "a + vowel sound", "an (an hour, an email, an area…)"],
  [/\b(he|she|it) (don't|have)\b/i, "he/she/it don't / have", "he/she/it doesn't / has"],
  [/\b(didn'?t|did not|does not|doesn'?t|do not|don'?t) (went|bought|made|came|saw|gave|took)\b/i,
    "did not + past form", "did not + base verb (did not buy, did not make)"],
  [/\bsince (\d+|two|three|four|five|six|a few|several) (days|weeks|months|years)\b/i,
    "since + a period", "for + a period (for two weeks); since + a point in time (since Monday)"],
  [/\bi (is|are)\b/, "I is / I are", "I am"],
  [/\b(they|we|you) (is|was)\b/i, "they/we/you is/was", "they/we/you are/were"],
  [/\bpeople (is|has)\b/i, "people is/has", "people are/have"],
  [/\b(could|would|should|can|will|must|might) (to )?(went|bought|did|made|came|was)\b/i,
    "modal + past form", "modal + base verb (could go, would buy)"],
  [/\blook forward to (hear|see|meet|receive)\b/i, "look forward to hear", "look forward to hearing"],
  [/\bmany (money|information|time|traffic|furniture)\b/i, "many + uncountable noun", "much / a lot of"],
  [/\bmore (bigger|cheaper|easier|larger|smaller|nicer)\b/i, "more + -er", "just the -er form (bigger, cheaper)"],
  [/\bmost (biggest|best|cheapest|largest)\b/i, "most + -est", "just the -est form"],
  [/\bexplain me\b/i, "explain me", "explain to me"],
  [/\bsuggest (me|you) to\b/i, "suggest me to", "suggest that I … / suggest + -ing"],
  [/\bwould like (meet|visit|know|ask|request|be|come|see)\b/i, "would like + verb", "would like to + verb"],
  [/\bon (morning|evening|afternoon)\b/i, "on morning", "in the morning"],
  [/\bin (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, "in + day", "on + day (on Sunday)"],
  [/\bmy self\b/i, "my self", "myself"],
  [/\bfrom (the )?(last|past) (\w+ )?(days?|weeks?|months?|years?)\b/i,
    "from last two weeks", "for the last two weeks / over the past two weeks"],
  [/\bevery days\b/i, "every days", "every day"],
];
export type Score = {
  words: number;
  sentences: number;
  paragraphs: number;
  avgSentence: number;
  varietyPct: number;
  linkers: string[];
  repeated: [string, number][];
  longSentences: number;
  estimate: number;
  notes: Note[];
};

const wordsOf = (t: string) => t.trim().match(/[A-Za-z']+/g) ?? [];
/** The word count the examiner uses: a number written in digits ("1980",
    "9.8%") is one word, and so is a hyphenated word ("over-grazing"). */
export const countWords = (t: string) =>
  (t.trim().match(/[A-Za-z0-9][A-Za-z0-9'’.,%\u2013-]*/g) ?? []).length;
const sentencesOf = (t: string) =>
  (t.trim().match(/[^.!?]+[.!?]+/g) ?? (t.trim() ? [t.trim()] : [])).map((s) => s.trim());
const parasOf = (t: string) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

function occurrences(text: string, list: string[]): string[] {
  // Flatten the line breaks first. A paragraph that opens "However," is the
  // clearest possible use of a linking word, and matching on a leading space
  // alone would miss every one of them.
  const t = " " + text.toLowerCase().replace(/\s+/g, " ") + " ";
  return list.filter((l) => t.includes(" " + l + " ") || t.includes(" " + l + ","));
}

export function score(
  text: string, minWords: number, kind: "task1" | "gt1" | "task2", check?: LetterCheck,
): Score {
  const ws = wordsOf(text);
  const ss = sentencesOf(text);
  const ps = parasOf(text);
  const words = countWords(text);

  const content = ws.map((w) => w.toLowerCase()).filter((w) => !STOP.has(w) && w.length > 2);
  const varietyPct = content.length ? Math.round((new Set(content).size / content.length) * 100) : 0;

  const counts: Record<string, number> = {};
  for (const w of content) counts[w] = (counts[w] ?? 0) + 1;
  const repeated = Object.entries(counts)
    .filter(([w]) => !(kind === "task1" && check?.topic?.includes(w)))
    .filter(([, c]) => c >= 4 && c / Math.max(1, content.length) > 0.022)
    .sort((a, b) => b[1] - a[1]).slice(0, 4) as [string, number][];

  // A process is linked by its sequence words (first, then, once, finally) as much as by "however".
  const linkers = occurrences(text, kind === "gt1" ? [...LINKERS, ...LETTER_LINKERS]
    : kind === "task1" && check?.process ? [...new Set([...LINKERS, ...SEQUENCE])] : LINKERS);
  const complex = occurrences(text, kind === "task1" ? [...COMPLEX, ...REPORT_COMPLEX] : COMPLEX);
  if (kind === "task1" && /,\s+[a-z]+ing\b/.test(text)) complex.push(", …ing");
  const informal = occurrences(text, INFORMAL);
  const avgSentence = ss.length ? Math.round((words / ss.length) * 10) / 10 : 0;
  const longSentences = ss.filter((s) => wordsOf(s).length > 40).length;

  /* An honest, narrow estimate. It starts at a middling band and moves only on
     things that can be counted without understanding the argument, and it never
     claims more than 7.5 — no counter can see whether the ideas are any good. */
  let est = 6;
  if (words < minWords) est -= Math.min(2, ((minWords - words) / minWords) * 4);
  if (words >= minWords + 40) est += 0.25;
  if (ps.length >= (kind === "task1" ? 3 : 4)) est += 0.5; else if (ps.length <= 1) est -= 1;
  if (linkers.length >= 5) est += 0.5; else if (linkers.length <= 1) est -= 0.5;
  if (complex.length >= 5) est += 0.5; else if (complex.length <= 1) est -= 0.5;
  if (varietyPct >= 62) est += 0.5; else if (varietyPct < 45) est -= 0.5;
  if (repeated.length >= 3) est -= 0.25;
  if (kind !== "gt1" && informal.length >= 3) est -= 0.25;
  if (avgSentence > 0 && (avgSentence < 9 || avgSentence > 30)) est -= 0.25;
  // Under the word count the examiner applies a penalty before judging anything
  // else, so no amount of good structure can rescue it. Saying otherwise would
  // send a student into the exam believing a short essay is survivable.
  /* Spelling and grammar slips, and for a GT letter with its own check, the
     bullet points, greeting, sign-off and tone that letter asks for. */
  const late: Note[] = [];
  const lower = text.toLowerCase();
  const misspelt = [...new Set(ws.map((w) => w.toLowerCase()).filter((w) => SPELL[w]))];
  const slips = SLIPS.map(([re, what, fix]) => ({ m: text.match(re), what, fix })).filter((x) => x.m);
  if (/(^|[.!?]\s+|\n)i\b/.test(text) || /\si\s/.test(text)) {
    slips.push({ m: ["i"] as unknown as RegExpMatchArray, what: "small “i” for yourself", fix: "always a capital I" });
  }
  est -= Math.min(1, (misspelt.length + slips.length) * 0.25);
  if (misspelt.length) {
    late.push({ kind: "fix", text: `Spelling: ${misspelt.slice(0, 6).map((w) => `${w} → ${SPELL[w]}`).join(", ")}.` });
  }
  for (const s of slips.slice(0, 5)) {
    late.push({ kind: "fix", text: `Grammar: “${s.m![0]}” (${s.what}) — correct: ${s.fix}.` });
  }
  if (kind === "gt1" && check) {
    const first = text.trim().split(/\n/)[0] ?? "";
    if (new RegExp("^\\s*" + check.greetRe, "i").test(first)) {
      late.push({ kind: "good", text: "The greeting is right for this letter." });
    } else {
      est -= 0.25;
      late.push({ kind: "fix", text: `Start with “${check.greetShow}” on a line of its own.` });
    }
    if (new RegExp(check.closeRe, "i").test(lower)) {
      late.push({ kind: "good", text: "The sign-off matches the greeting." });
    } else {
      est -= 0.25;
      late.push({ kind: "fix", text: `End with “${check.closeShow}” and then your name.` });
    }
    check.bullets.forEach((b, i) => {
      const hits = b.kw.filter((k) => new RegExp(k, "i").test(lower)).length;
      if (hits === 0) {
        est -= 1;
        late.push({ kind: "fix", text: `Bullet point ${i + 1} is missing: ${b.label.toLowerCase()}. Give it a paragraph of its own — a missing bullet point costs the most marks in a letter.` });
      } else if (hits === 1) {
        est -= 0.25;
        late.push({ kind: "fix", text: `Bullet point ${i + 1} (${b.label.toLowerCase()}) is only touched on. Develop it with two or three sentences and a specific detail.` });
      } else {
        late.push({ kind: "good", text: `Bullet point ${i + 1} is covered: ${b.label.toLowerCase()}.` });
      }
    });
    if (check.tone === "formal") {
      const short = text.match(/\b(I'm|I've|I'd|I'll|don't|didn't|can't|won't|isn't|wasn't|it's|that's|couldn't|wouldn't|haven't)\b/gi);
      if (short) {
        est -= 0.25;
        late.push({ kind: "fix", text: `Short forms in a formal letter: ${[...new Set(short)].slice(0, 5).join(", ")}. Write them in full — I am, do not, cannot.` });
      }
      const casual = lower.match(/\b(gonna|wanna|guys|hey|hi|cheers|thanks a lot|ok|okay|yeah|stuff|lots of|kinda|asap|thanx|bye|dude|bro)\b/g);
      if (casual) {
        est -= 0.25;
        late.push({ kind: "fix", text: `Too casual for this letter: ${[...new Set(casual)].join(", ")}. Use formal words — “many” for “lots of”, “as soon as possible” for “asap”.` });
      }
    } else if (/yours faithfully|dear sir|to whom it may concern/i.test(lower)) {
      est -= 0.25;
      late.push({ kind: "fix", text: "Formal phrases in a letter to a friend. Keep it warm and personal — “Dear Ravi,” … “Best wishes,”." });
    }
  }

  if (kind === "task1" && check) {
    check.bullets.forEach((b, i) => {
      const hits = b.kw.filter((k) => new RegExp(k, "i").test(lower)).length;
      const what = check.process ? "Stage" : "Key feature";
      if (hits === 0) {
        est -= 1;
        late.push({ kind: "fix", text: check.process
          ? `Stage ${i + 1} is missing: ${b.label}. Describe it, in order, with the words on the diagram.`
          : check.map ? `Key feature ${i + 1} is missing: ${b.label}. Describe it, saying where it is or how it changed.`
          : `Key feature ${i + 1} is missing: ${b.label}. Describe it, with the figures from the chart that show it.` });
      } else if (hits === 1) {
        est -= 0.25;
        late.push({ kind: "fix", text: check.process
          ? `Stage ${i + 1} (${b.label}) is only touched on. Describe each step in it, in order.`
          : check.map ? `Key feature ${i + 1} (${b.label}) is only touched on. Say exactly where it is, and what replaced what.`
          : `Key feature ${i + 1} (${b.label}) is only touched on. Give it more detail and the key figures.` });
      } else {
        late.push({ kind: "good", text: `${what} ${i + 1} is covered: ${b.label}.` });
      }
    });
    const figures = (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).length; // "120,000" is one figure
    if (check.process) {
      /* No figures to report in a process. What it needs instead: the stages
         in order, and (for a man-made process) the passive. */
      const seq = occurrences(text, SEQUENCE);
      if (seq.length < 3) {
        est -= 0.5;
        late.push({ kind: "fix", text: `Only ${seq.length} sequence word${seq.length === 1 ? "" : "s"}. Guide the reader through the stages: first, then, next, after this, once…, finally.` });
      } else if (seq.length >= 5) {
        late.push({ kind: "good", text: `The stages are clearly ordered (${seq.slice(0, 5).join(", ")}).` });
      }
      const passive = (text.match(/\b(?:is|are|was|were|be|been|being)\s+(?:then\s+|first\s+|also\s+|finally\s+)?(?:[a-z]+ed|built|made|sent|taken|put|kept|cut|ground|sold|brought|fed|grown|drawn|spread|held|shown|known|given|done|seen|thrown|frozen|chosen|driven)\b/gi) ?? []).length;
      if (!check.natural && passive < 3) {
        est -= 0.25;
        late.push({ kind: "fix", text: `This is a man-made process, so use the passive for the steps: “the oranges are washed”, “the beans are roasted”. You used it ${passive} time${passive === 1 ? "" : "s"}.` });
      } else if (!check.natural) {
        late.push({ kind: "good", text: `Passive verbs used for the steps (${passive}), as a man-made process needs.` });
      }
    } else if (check.map) {
      /* A map has few or no numbers; what it needs is the language of place
         and change: located, to the north of, replaced, demolished, extended. */
      const place = (lower.match(/\b(?:north|south|east|west|north-east|north-west|south-east|south-west|next to|opposite|beside|between|near|adjacent|located|situated|lies|in the (?:centre|middle|corner))\b/g) ?? []).length;
      const change = (lower.match(/\b(?:replaced|demolished|built|constructed|added|removed|extended|expanded|converted|reduced|moved|relocated|remained|unchanged|became|will be|had been|has been)\b/g) ?? []).length;
      if (place < 3) {
        est -= 0.5;
        late.push({ kind: "fix", text: "Say where things are: to the north of, next to, opposite, in the centre of. A map report is mostly about location." });
      }
      if (change < 2 && !/\bs1\b|\bs2\b|site/i.test(lower)) {
        est -= 0.25;
        late.push({ kind: "fix", text: "Describe the changes with the passive: was replaced by, had been built, will be extended." });
      }
    } else if (figures < 4) {
      est -= 0.5;
      late.push({ kind: "fix", text: `Only ${figures} figure${figures === 1 ? "" : "s"} from the chart. Support each main feature with the numbers or percentages that prove it.` });
    } else if (figures > 35) {
      est -= 0.25;
      late.push({ kind: "fix", text: `${figures} figures — that is listing, not selecting. Report the main features and the numbers that matter.` });
    }
    if (check.prompt) {
      // Names (Yemen, Italy, Australia) cannot be paraphrased, so they are left out.
      const plain = (z: string) => (z.match(/[A-Za-z]+/g) ?? [])
        .filter((w, i) => i === 0 || !/^[A-Z]/.test(w)).map((w) => w.toLowerCase());
      const q = " " + plain(check.prompt).join(" ") + " ";
      const first = plain(ps[0] ?? "");
      for (let x = 0; x + 7 <= first.length; x++) {
        if (q.includes(" " + first.slice(x, x + 7).join(" ") + " ")) {
          est -= 0.25;
          late.push({ kind: "fix", text: "Your introduction copies the question word for word. Paraphrase it — “show” → “illustrate”, “information on” → “data about”." });
          break;
        }
      }
    }
  }

  const ceiling = words < minWords ? 5.5 : 7.5;
  const estimate = Math.max(3.5, Math.min(ceiling, Math.round(est * 2) / 2));

  const notes: Note[] = [];
  const say = (kind: Note["kind"], text: string) => notes.push({ kind, text });

  if (words < minWords) {
    say("fix", `${words} words. The task asks for at least ${minWords}, and an under-length answer is penalised before anything else is even read — you need ${minWords - words} more.`);
  } else {
    say("good", `${words} words — over the ${minWords} minimum, so nothing is lost on length.`);
  }

  if (ps.length <= 1) {
    say("fix", "It is one block of text. Break it into paragraphs — introduction, one idea per body paragraph, conclusion. This is the single quickest mark to gain.");
  } else if (ps.length >= (kind === "task1" ? 3 : 4)) {
    say("good", `${ps.length} paragraphs, which is the shape the examiner is looking for.`);
  } else {
    const aim = kind === "task2" ? "Aim for four: introduction, two body paragraphs, conclusion."
      : kind === "gt1" ? "Aim for five: greeting, opening line with your reason for writing, one paragraph per bullet point, then the sign-off."
      : "Aim for three: overview, then the detail in two groups.";
    say("fix", `Only ${ps.length} paragraphs. ${aim}`);
  }

  if (linkers.length <= 1) {
    say("fix", "Almost no linking words. Join your ideas with however, moreover, as a result, in contrast — the examiner is marking whether the reader is guided through.");
  } else if (linkers.length >= 5) {
    say("good", `You used ${linkers.length} different linking expressions: ${linkers.slice(0, 5).join(", ")}.`);
  }

  if (complex.length <= 1) {
    say("fix", "Every sentence is simple. Combine some with although, because, which, whereas — grammatical range is a whole quarter of the mark.");
  } else if (complex.length >= 5) {
    say("good", "Good mix of simple and complex sentences.");
  }

  if (repeated.length) {
    say("fix", `Repeated a lot: ${repeated.map(([w, c]) => `"${w}" ×${c}`).join(", ")}. Find another way to say each one at least once.`);
  }
  if (varietyPct >= 62) say("good", `${varietyPct}% of your content words are different ones — good range.`);
  else if (varietyPct < 45) say("fix", `Only ${varietyPct}% of your content words are different. The same vocabulary is going round and round.`);

  if (longSentences) say("fix", `${longSentences} sentence${longSentences === 1 ? " runs" : "s run"} past 40 words. Long is not the same as complex — split ${longSentences === 1 ? "it" : "them"}.`);
  // a letter to a friend is meant to be informal, so this only applies to Task 1 charts and essays
  if (kind !== "gt1" && informal.length >= 3) say("fix", `Informal for an academic essay: ${informal.slice(0, 4).join(", ")}. Keep the register formal.`);

  if (kind === "task1" && /\bi (think|believe|feel)\b/i.test(text)) {
    say("fix", "Task 1 has no opinion in it. Report what the chart shows and compare — never what you think of it.");
  }
  if (kind === "task1" && !/\boverall\b|\bin summary\b/i.test(text)) {
    say("fix", check?.map
      ? "There is no overview. Start a paragraph with “Overall,” and give the biggest change (or the key difference between the sites) in one sentence — leaving it out caps the mark for Task Achievement."
      : check?.process
      ? "There is no overview. Start a paragraph with “Overall,” and say how many main stages there are, where the process begins and where it ends — leaving it out caps the mark for Task Achievement."
      : "There is no overview. Task 1 must state the main trend in one sentence — leaving it out caps the mark for Task Achievement.");
  }
  /* A GT letter is marked on purpose, bullet points and tone, not on an
     overview. What can be counted: it opens as a letter and closes as one. */
  if (kind === "gt1" && !check) {
    const first = text.trim().split(/\n/)[0] ?? "";
    if (!/^\s*(dear|hi|hello)\b/i.test(first)) {
      say("fix", "Start with the greeting you were given (Dear Sir or Madam, / Dear Mr Evans, / Dear Tom,) on a line of its own.");
    }
    if (!/(yours (faithfully|sincerely|truly)|kind regards|best regards|best wishes|all the best|take care|love|regards|cheers)\s*,?/i.test(text.slice(-160))) {
      say("fix", "No sign-off. Close with one that matches your greeting — Yours faithfully (Dear Sir or Madam), Yours sincerely (a name), Best wishes (a friend) — then your name.");
    }
    if (/\b(overall|in conclusion|to conclude)\b/i.test(text)) {
      say("fix", "A letter does not need an overview or a conclusion — finish with what you want to happen next, then sign off.");
    }
  }
  if (kind === "task2" && !/\bconclusion\b|\bto conclude\b|\boverall\b|\bin summary\b/i.test(text)) {
    say("fix", "No conclusion. Finish by answering the question directly in one or two sentences.");
  }

  notes.push(...late);

  return { words, sentences: ss.length, paragraphs: ps.length, avgSentence, varietyPct,
           linkers, repeated, longSentences, estimate, notes };
}
