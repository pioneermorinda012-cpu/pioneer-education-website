/**
 * The English trainers (A1 to C2 — complete courses with Hindi and
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
  {
    id: "b1",
    file: "b1.html",
    title: "English B1 Trainer",
    blurb: "Intermediate English course in 19 units, with Hindi and Punjabi translations. Works offline.",
    tags: ["Intermediate", "B1"],
  },
  {
    id: "b2",
    file: "b2.html",
    title: "English B2 Trainer",
    blurb: "Upper-intermediate English course in 17 units, with Hindi and Punjabi translations. Works offline.",
    tags: ["Upper-intermediate", "B2"],
  },
  {
    id: "c1",
    file: "c1.html",
    title: "English C1 Trainer",
    blurb: "Advanced English course in 15 units, with Hindi and Punjabi translations. Works offline.",
    tags: ["Advanced", "C1"],
  },
  {
    id: "c2",
    file: "c2.html",
    title: "English C2 Trainer",
    blurb: "Proficiency English course in 13 units, with Hindi and Punjabi translations. Works offline.",
    tags: ["Proficiency", "C2"],
  },
];

export const englishItem = (id: string) => ENGLISH.find((p) => p.id === id) ?? null;
