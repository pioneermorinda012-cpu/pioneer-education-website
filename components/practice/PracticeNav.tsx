import Link from "next/link";
import { SKILLS } from "@/lib/catalogue";

/**
 * The one menu every practice page shows, so Writing, PTE and English are
 * always a tap away rather than hidden behind the test library. Skills that
 * have no papers yet are simply not listed — a "coming soon" button is a dead
 * end for a student, and it tells them nothing they can act on.
 *
 * The buttons sit in three labelled groups that wrap onto new lines instead of
 * running off the side of the screen: on a phone, a button you have to scroll
 * sideways to find is a button nobody finds.
 *
 * `active` is a skill code (AL, AR, GR…), a writing task (W1, WG, W2), PTE or ENGLISH.
 */
export default function PracticeNav({ active }: { active: string }) {
  const here = (code: string) => (code === active ? "page" : undefined);
  return (
    <nav className="pr-skills pr-menu" aria-label="Choose what to practise">
      <div className="pr-menu-g">
        <span className="pr-menu-h">IELTS tests</span>
        {SKILLS.filter((s) => s.available).map((s) => (
          <Link key={s.code} href={`/practice?skill=${s.code}`} aria-current={here(s.code)}>
            {s.label}
          </Link>
        ))}
      </div>
      <div className="pr-menu-g">
        <span className="pr-menu-h">Writing</span>
        <Link href="/practice/writing?task=1" aria-current={here("W1")}>Task 1 · Academic</Link>
        <Link href="/practice/writing?task=gt1" aria-current={here("WG")}>Task 1 · GT letter</Link>
        <Link href="/practice/writing?task=2" aria-current={here("W2")}>Task 2</Link>
      </div>
      <div className="pr-menu-g">
        <span className="pr-menu-h">More practice</span>
        <Link href="/practice/pte" aria-current={here("PTE")}>PTE</Link>
        <Link href="/practice/english" aria-current={here("ENGLISH")}>English</Link>
      </div>
    </nav>
  );
}
