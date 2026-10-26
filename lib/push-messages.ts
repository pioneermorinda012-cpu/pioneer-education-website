/* The words of the automatic reminders (app/api/cron/reminders/route.ts).
 *
 * Morning (about 8 am): a word of the day — English, with its German — and a
 * nudge to practise. Every student with reminders on gets it.
 * Evening (about 7 pm): only students who have not practised that day, with
 * a short reason to do ten minutes now.
 *
 * One message per day, chosen by the date, so everyone gets the same word on
 * the same day and a student never sees the same evening line twice in a row.
 * Edit freely: plain text, keep the body under about 120 characters so phones
 * show all of it.
 */
import type { Message } from "@/lib/push";

const WORDS: [string, string, string][] = [
  // word, meaning, German
  ["meticulous", "very careful about every detail", "sorgfältig"],
  ["fluctuate", "to rise and fall again and again", "schwanken"],
  ["substantial", "large in amount or importance", "beträchtlich"],
  ["alleviate", "to make a problem less severe", "lindern"],
  ["coherent", "logical and easy to follow", "zusammenhängend"],
  ["predominantly", "mostly; mainly", "überwiegend"],
  ["resilient", "able to recover quickly from problems", "widerstandsfähig"],
  ["consequently", "as a result", "folglich"],
  ["negligible", "so small it hardly matters", "unbedeutend"],
  ["elaborate", "to explain in more detail", "ausführen"],
  ["inevitable", "certain to happen", "unvermeidlich"],
  ["proportion", "a part of a whole", "der Anteil"],
  ["advocate", "to publicly support an idea", "befürworten"],
  ["detrimental", "causing harm", "schädlich"],
  ["feasible", "possible and practical", "machbar"],
  ["diminish", "to become smaller or less", "abnehmen"],
  ["comprehensive", "including everything", "umfassend"],
  ["prevalent", "common in a place or time", "verbreitet"],
  ["undeniable", "clearly true", "unbestreitbar"],
  ["surge", "a sudden large increase", "der Anstieg"],
  ["versatile", "able to do many different things", "vielseitig"],
  ["indispensable", "absolutely necessary", "unverzichtbar"],
  ["plummet", "to fall very quickly", "stark fallen"],
  ["mitigate", "to make something less harmful", "abmildern"],
  ["perspective", "a way of thinking about something", "die Perspektive"],
  ["consistent", "staying the same over time", "beständig"],
  ["tremendous", "very great", "enorm"],
  ["acquire", "to get or learn something", "erwerben"],
  ["stagnant", "not changing or growing", "stagnierend"],
  ["thrive", "to grow and do well", "gedeihen"],
  ["persevere", "to keep trying despite difficulty", "durchhalten"],
];

const NUDGES = [
  "One Reading test before lunch?",
  "Ten minutes of practice today keeps your band moving.",
  "Try using it in today's writing practice.",
  "Open a trainer and pick up where you left off.",
  "A Listening test today? Your progress is saved.",
  "Small daily practice beats one long weekend.",
  "Write one Task 1 paragraph using it today.",
];

const EVENING: [string, string][] = [
  ["Ten minutes before bed?", "You haven't practised today. One short trainer unit is enough to keep going."],
  ["Your practice is waiting", "Pick up exactly where you left off — your progress is saved."],
  ["Quick one tonight?", "Do one Listening section or one Reading passage. Ten minutes counts."],
  ["Keep the habit going", "Students who practise every day improve fastest. Ten minutes now?"],
  ["Don't break the chain", "A little every day adds up. Open a trainer and do one unit."],
  ["Finish the day strong", "Write one paragraph, read one passage or learn five new words."],
  ["Still time today", "Do one short unit before you sleep — tomorrow you will remember more."],
  ["Practice beats talent", "Ten focused minutes tonight will help more than you think."],
  ["One task tonight", "Try one Writing Task 1 — the instant check tells you what to fix."],
  ["Your exam is getting closer", "Every day counts. Do one short practice now."],
];

/** Day number in India time, so "today" matches the students' day. */
export function istDay(now = Date.now()): number {
  return Math.floor((now + 5.5 * 3600_000) / 86_400_000);
}

/** Midnight today, India time, as an ISO string. */
export function istMidnightIso(now = Date.now()): string {
  return new Date(istDay(now) * 86_400_000 - 5.5 * 3600_000).toISOString();
}

const first = (name: string) => name.trim().split(/\s+/)[0] || "";

export function morningMessage(name: string, url: string, now = Date.now()): Message {
  const d = istDay(now);
  const [w, meaning, de] = WORDS[d % WORDS.length];
  const nudge = NUDGES[d % NUDGES.length];
  const hi = first(name) ? `Good morning, ${first(name)}! ` : "Good morning! ";
  return {
    title: `${hi}Word of the day: ${w}`,
    body: `${meaning} · German: ${de}. ${nudge}`,
    url, tag: "pioneer-morning",
  };
}

export function eveningMessage(name: string, url: string, now = Date.now()): Message {
  const [t, b] = EVENING[istDay(now) % EVENING.length];
  return {
    title: first(name) ? `${first(name)}, ${t.charAt(0).toLowerCase()}${t.slice(1)}` : t,
    body: b, url, tag: "pioneer-evening",
  };
}
