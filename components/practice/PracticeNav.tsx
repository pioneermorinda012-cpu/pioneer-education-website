import Link from "next/link";
import { SKILLS } from "@/lib/catalogue";
import { allows, SKILL_AREAS, type Area } from "@/lib/access";
import type { Session } from "@/lib/session";

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
 * Only the modules this login opens are listed (lib/access.ts): an IELTS
 * Academic student does not see GT Reading or PTE, and an English student
 * sees English. A group with nothing left in it is not shown.
 *
 * `active` is a skill code (AL, AR, GR…), a writing task (W1, WG, W2), PTE or ENGLISH.
 */
export default function PracticeNav({ active, session }: { active: string; session?: Session | null }) {
  const here = (code: string) => (code === active ? "page" : undefined);
  // no session handed in: show everything, as before
  const can = (need: Area[]) => (session ? allows(session, need) : true);

  const tests = SKILLS.filter((s) => s.available && can(SKILL_AREAS[s.code]));
  const writing = [
    { href: "/practice/learn", code: "LEARN", label: "Learn Task 1 ▶", need: ["academic"] as Area[] },
    { href: "/practice/writing?task=1", code: "W1", label: "Task 1 · Academic", need: ["academic"] as Area[] },
    { href: "/practice/writing?task=gt1", code: "WG", label: "Task 1 · GT letter", need: ["gt"] as Area[] },
    { href: "/practice/writing?task=2", code: "W2", label: "Task 2", need: ["academic", "gt"] as Area[] },
  ].filter((w) => can(w.need));
  const more = [
    { href: "/practice/pte", code: "PTE", label: "PTE", need: ["pte"] as Area[] },
    { href: "/practice/english", code: "ENGLISH", label: "English", need: ["english"] as Area[] },
    { href: "/practice/german", code: "GERMAN", label: "German", need: ["german"] as Area[] },
    { href: "/practice/french", code: "FRENCH", label: "French", need: ["french"] as Area[] },
  ].filter((m) => can(m.need));

  // one module only and nothing to switch to: no menu at all
  if (tests.length + writing.length + more.length <= 1) return null;

  return (
    <nav className="pr-skills pr-menu" aria-label="Choose what to practise">
      {tests.length > 0 && (
        <div className="pr-menu-g">
          <span className="pr-menu-h">IELTS tests</span>
          {tests.map((s) => (
            <Link key={s.code} href={`/practice?skill=${s.code}`} aria-current={here(s.code)}>
              {s.label}
            </Link>
          ))}
          <a href="/practice/lab/speaking">Speaking Lab</a>
        </div>
      )}
      {writing.length > 0 && (
        <div className="pr-menu-g">
          <span className="pr-menu-h">Writing</span>
          {writing.map((w) => (
            <Link key={w.code} href={w.href} aria-current={here(w.code)}>{w.label}</Link>
          ))}
        </div>
      )}
      {more.length > 0 && (
        <div className="pr-menu-g">
          <span className="pr-menu-h">More practice</span>
          {more.map((m) => (
            <Link key={m.code} href={m.href} aria-current={here(m.code)}>{m.label}</Link>
          ))}
        </div>
      )}
    </nav>
  );
}
