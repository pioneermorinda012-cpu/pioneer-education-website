import Link from "next/link";
import { SKILLS } from "@/lib/catalogue";

/**
 * The one menu every practice page shows, so Writing and PTE are always a tap
 * away rather than hidden behind the test library. Skills that have no papers
 * yet are simply not listed — a "coming soon" button is a dead end for a
 * student, and it tells them nothing they can act on.
 *
 * `active` is a skill code (AL, AR, GR…), a writing task (W1, WG, W2) or PTE.
 */
export default function PracticeNav({ active }: { active: string }) {
  const here = (code: string) => (code === active ? "page" : undefined);
  return (
    <nav className="pr-skills" aria-label="Choose what to practise">
      {SKILLS.filter((s) => s.available).map((s) => (
        <Link key={s.code} href={`/practice?skill=${s.code}`} aria-current={here(s.code)}>
          {s.label}
        </Link>
      ))}
      <i className="pr-sep" aria-hidden />
      <Link href="/practice/writing?task=1" aria-current={here("W1")}>Writing Task 1 · Academic</Link>
      <Link href="/practice/writing?task=gt1" aria-current={here("WG")}>Writing Task 1 · GT letter</Link>
      <Link href="/practice/writing?task=2" aria-current={here("W2")}>Writing Task 2</Link>
      <i className="pr-sep" aria-hidden />
      <Link href="/practice/pte" aria-current={here("PTE")}>PTE</Link>
    </nav>
  );
}
