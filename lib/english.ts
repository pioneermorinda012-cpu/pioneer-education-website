/**
 * The English trainers (A1, A2 — complete beginner courses with Hindi and
 * Punjabi translations). Each is a self-contained page of its own, so they
 * are kept whole in content/english and served as they are, behind the same
 * student sign-in as the rest of /practice.
 * The list lives here, not in the files, so adding a trainer is one line.
 */
export type EnglishItem = {
  id: string;
  file: string;
  title: string;
  blurb: string;
  tags: string[];
};

export const ENGLISH: EnglishItem[] = [
  {
    id: "a1",
    file: "a1.html",
    title: "English A1 Trainer",
    blurb: "Complete beginner English course with Hindi and Punjabi translations. Works offline.",
    tags: ["Beginner", "A1"],
  },
  {
    id: "a2",
    file: "a2.html",
    title: "English A2 Trainer",
    blurb: "Elementary English course with Hindi and Punjabi translations. Works offline.",
    tags: ["Elementary", "A2"],
  },
];

export const englishItem = (id: string) => ENGLISH.find((p) => p.id === id) ?? null;
