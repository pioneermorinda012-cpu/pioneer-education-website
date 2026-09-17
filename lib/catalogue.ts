import fs from "node:fs/promises";
import path from "node:path";

export type SkillCode = "AL" | "AR" | "GL" | "GR";

export const SKILLS: { code: SkillCode; label: string; available: boolean }[] = [
  { code: "AL", label: "Academic Listening", available: true },
  { code: "AR", label: "Academic Reading", available: true },
  { code: "GR", label: "GT Reading", available: true },
  { code: "GL", label: "GT Listening", available: false },
];

export type CatalogueEntry = {
  id: string;
  skill: SkillCode;
  skillLabel: string;
  set: string;
  label: string;
  order: number;
  name: string;
  minutes: number;
  total: number;
  mode: "listening" | "reading";
  sections: number;
  /** false when the paper exists but its answer key has not been added yet */
  keyed: boolean;
};

const CONTENT = path.join(process.cwd(), "content");

export async function getCatalogue(): Promise<CatalogueEntry[]> {
  const raw = await fs.readFile(path.join(CONTENT, "catalogue.json"), "utf8");
  const all = JSON.parse(raw) as CatalogueEntry[];
  return all.sort((a, b) => a.set.localeCompare(b.set) || a.order - b.order);
}

/** Where the audio and diagrams are actually served from.
 *  Unset in local development, so the files in public/practice/media are used. */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "").replace(/\/+$/, "");

/** The paper, with no answers in it — safe to send to the browser. */
export async function getTest(id: string) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error("bad test id");
  const raw = await fs.readFile(path.join(CONTENT, "tests", `${id}.json`), "utf8");
  const test = JSON.parse(raw);

  // The papers still carry the id they were authored under ("plus1_R1"), while
  // the files, the catalogue and the answer keys all use the library id
  // ("ar-a1"). The player sends test.id back when it submits, so leaving the
  // old one in place made every single test fail to mark. One source of truth:
  // the id the file is stored under wins.
  test.internalId = test.id;
  test.id = id;
  if (test.catalogue) test.catalogue.id = id;

  // Each paper stores site-relative media paths like /practice/media/al-a1/audio_main.mp3.
  // The recordings are far too large to keep in the repository, so when a media host is
  // configured those paths are re-pointed at it. With the variable unset the local files
  // are used instead, which is what lets `npm run dev` work with no extra setup.
  // Only the recordings move. They are ~9 MB each, far too large for the
  // repository, so they live in storage. The diagrams are a few kilobytes,
  // ship with the site, and are deliberately left alone — one less thing that
  // can break, and maps and charts keep working even if storage is misconfigured.
  if (MEDIA_BASE && test.mediaUrls) {
    for (const k of Object.keys(test.mediaUrls)) {
      const v = String(test.mediaUrls[k]);
      if (v.startsWith("/practice/media/") && /\.(mp3|m4a|wav|ogg|aac)$/i.test(v)) {
        test.mediaUrls[k] = MEDIA_BASE + v.slice("/practice/media".length);
      }
    }
  }
  return test;
}

/** SERVER ONLY. Never return this from a route the browser can read. */
export async function getKey(id: string) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error("bad test id");
  const raw = await fs.readFile(path.join(CONTENT, "keys", `${id}.json`), "utf8");
  return JSON.parse(raw);
}
