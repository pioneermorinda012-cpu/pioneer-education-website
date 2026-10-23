/**
 * The German trainers (Gleis A1, A2, B1 — Goethe exam practice). Same pattern
 * as lib/english.ts: each is a self-contained page kept whole in
 * content/german and served as it is, behind the student sign-in.
 * Adding a trainer is one line here plus its file.
 */
export type GermanItem = {
  id: string;
  file: string;
  title: string;
  blurb: string;
  tags: string[];
};

export const GERMAN: GermanItem[] = [
  {
    id: "a1",
    file: "a1.html",
    title: "Gleis A1 — German A1 Trainer",
    blurb: "Beginner German for the Goethe A1 exam: Hören, Lesen, Schreiben and Sprechen practice. Works offline.",
    tags: ["Beginner", "A1", "Goethe"],
  },
  {
    id: "a2",
    file: "a2.html",
    title: "Gleis A2 — German A2 Trainer",
    blurb: "Elementary German for the Goethe A2 exam: all four modules, with exam-style practice. Works offline.",
    tags: ["Elementary", "A2", "Goethe"],
  },
  {
    id: "b1",
    file: "b1.html",
    title: "Gleis B1 — German B1 Trainer",
    blurb: "Intermediate German for the Goethe B1 exam, the level most visas ask for. Works offline.",
    tags: ["Intermediate", "B1", "Goethe"],
  },
];

export const germanItem = (id: string) => GERMAN.find((p) => p.id === id) ?? null;
