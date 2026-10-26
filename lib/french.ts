/**
 * The French trainers (Pioneer French A1; A2 and B1 to follow). Same pattern
 * as lib/german.ts: each is a self-contained page kept whole in
 * content/french and served as it is, behind the student sign-in.
 * Adding a level is one line here plus its file.
 */
export type FrenchItem = {
  id: string;
  file: string;
  title: string;
  blurb: string;
  tags: string[];
};

export const FRENCH: FrenchItem[] = [
  {
    id: "a1",
    file: "a1.html",
    title: "Pioneer French A1 — French A1 Trainer",
    blurb: "French from the first sound to the passé composé: 21 units with audio, DELF A1 listening, reading, writing and speaking, an AI tutor and a full mock exam.",
    tags: ["Beginner", "A1", "DELF"],
  },
];

export const frenchItem = (id: string) => FRENCH.find((p) => p.id === id) ?? null;
