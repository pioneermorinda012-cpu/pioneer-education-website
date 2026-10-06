"""Repair Volume 6 Reading Tests 1-6 after import.

    python scripts/fix-v6-reading.py <repo-root>

Safe to run more than once.

Question text the import lost
  * Test 1 Q20-26: the flow-chart kept only its first line, so gaps 21-26
    had nowhere to be typed. Rebuilt from the paper.
  * Test 6 Q22-27: the notes were lost entirely. Rebuilt from the paper.
  * Test 6 Q40: the paper cuts the description off at "in an interactive";
    the passage's word "way" completes it ("a supernatural way to interact").

Keys (accept what the passage says, inside the word limit)
  * Test 1 Q11 drops "Factory Act of 1833": four words, limit is three.
  * Test 2 Q37-39 (choose THREE): the paper accepted four letters. E ("open-
    ended answers in questionnaires") is contradicted: open-ended questions
    are asked in interviews "instead of ... a postal questionnaire". B, D, F.
  * Test 3 Q27 drops "growth rate" ("speed of growth rate" is not English).
  * Test 4 Q40 drops "double flame burning" ("a double flame burning").

Test 2 Q40 is printed without an option B in the paper itself; it stays A, C, D.
"""
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])


def load(kind, tid):
    return json.loads((root / "content" / kind / f"{tid}.json").read_text("utf8"))


def save(kind, tid, data, indent=None):
    (root / "content" / kind / f"{tid}.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=indent), "utf8")


LINES = {
    ("v6r1", "Questions 20–26"): [
        "<b>Bestcom Working Process</b>",
        "Bestcom system makes further efforts in order to find {{20}} about what users are doing.",
        "↓",
        "<b>In the office</b>",
        "Check the {{21}} between the caller and the user, whether the caller has contact information of the "
        "user, such as their family, friends or colleagues.",
        "↓",
        "If callers are not in directory, a(n) {{22}} will show up on their screen, saying the user is not "
        "available at the moment.",
        "The system will {{23}} a suitable time for both, or callers can choose to leave a(n) {{24}} to users.",
        "<b>Out of the office</b>",
        "Bestcom will provide a solution by transferring your call to the user {{25}} if there is no {{26}} "
        "in his or her schedule.",
    ],
    ("v6r6", "Questions 22–27"): [
        "<b>A comparative study of two ancient cultures</b>",
        "<b>the Kiffian</b>",
        "• They seemed to be peaceful and industrious since the researcher did not find {{22}} on their heads "
        "and forearms.",
        "• Their lifestyle was {{23}}",
        "• Through the observation on the huge leg muscles, it could be inferred that their diet had plenty "
        "of {{24}}",
        "<b>the Tenerian</b>",
        "• Stojanowski presumed that the Tenerian preferred herding to {{25}}",
        "• But only the bones of individual animals such as {{26}} were found.",
        "• Sereno supposed the Tenerian in Gobero lived in a {{27}} group at that time.",
    ],
}

DROP = {"v6r1": {"11": "Factory Act of 1833"}, "v6r3": {"27": "growth rate"},
        "v6r4": {"40": "double flame burning"}}


def main():
    for (tid, title), lines in LINES.items():
        t = load("tests", tid)
        for s in t["sections"]:
            for g in s["groups"]:
                if g.get("title") == title:
                    g["lines"] = lines
                    g.pop("questions", None)
        if tid == "v6r6":
            for s in t["sections"]:
                for g in s["groups"]:
                    for q in g.get("questions", []):
                        if q["n"] == 40 and q["stem"].rstrip().endswith("in an interactive"):
                            q["stem"] = q["stem"].rstrip() + " way"
        save("tests", tid, t)
        print(tid, title, "rebuilt")

    for tid, drops in DROP.items():
        k = load("keys", tid)
        for q, gone in drops.items():
            k[q]["accept"] = [a for a in k[q]["accept"] if a.lower() != gone.lower()]
            if k[q]["display"].lower() == gone.lower():
                k[q]["display"] = k[q]["accept"][0]
        save("keys", tid, k, 1)
        print(tid, "key tightened", ", ".join(drops))

    k = load("keys", "v6r2")
    for i, q in enumerate(("37", "38", "39")):
        k[q] = {"any": ["B", "D", "F"], "pick": 3, "lead": 37, "idx": i,
                "display": "B, D, F  (Q37–39, any order)"}
    save("keys", "v6r2", k, 1)
    print("v6r2 Q37-39 keyed B, D, F")


if __name__ == "__main__":
    main()
