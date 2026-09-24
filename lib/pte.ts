/**
 * The PTE trainers.
 *
 * Each one is a self-contained page built for the institute (audio, timers and
 * marking all inside the file), so they are kept whole in content/pte and
 * served as they are, behind the same student sign-in as the rest of /practice.
 * The list lives here, not in the files, so adding a trainer is one line.
 */
export type PteItem = {
  id: string;
  file: string;
  title: string;
  blurb: string;
  tags: string[];
  /** needs the microphone (Speaking) — the page says so before a student opens it */
  mic?: boolean;
};

export const PTE: PteItem[] = [
  {
    id: "diagnostic",
    file: "diagnostic.html",
    title: "PTE Academic — Diagnostic Test",
    blurb: "Start here. A short test across all four skills that shows where you stand and which question types to work on first.",
    tags: ["All skills", "Start here"],
    mic: true,
  },
  {
    id: "speaking-writing",
    file: "speaking-writing.html",
    title: "PTE Speaking & Writing Trainer",
    blurb: "Read Aloud, Repeat Sentence, Describe Image, Retell Lecture, Answer Short Question, Summarize Group Discussion, Respond to a Situation, Summarize Written Text and Write Essay.",
    tags: ["Speaking", "Writing"],
    mic: true,
  },
  {
    id: "reading",
    file: "reading.html",
    title: "PTE Reading Trainer",
    blurb: "Fill in the Blanks, Multiple Choice (single and multiple answers) and Re-order Paragraphs.",
    tags: ["Reading"],
  },
  {
    id: "listening",
    file: "listening.html",
    title: "PTE Listening Trainer",
    blurb: "Summarize Spoken Text, Multiple Choice, Fill in the Blanks, Highlight Correct Summary, Select Missing Word, Highlight Incorrect Words and Write from Dictation.",
    tags: ["Listening"],
  },
];

export const pteItem = (id: string) => PTE.find((p) => p.id === id) ?? null;
