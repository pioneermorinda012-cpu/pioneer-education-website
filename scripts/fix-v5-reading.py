"""Tidy and correct Volume 5 Reading Tests 1-6 after import.

    python scripts/fix-v5-reading.py <repo-root>

Safe to run more than once.

Layout
  * Notes/summaries "using the list of words" (T1 Q33-37, T3 Q36-40,
    T5 Q27-31) came over as one dropdown per gap, each repeating the whole
    text. They are shown once with the word box and a box per gap; the gap
    takes the letter or the word itself. T1 gets back its two headings
    (over-the-counter / prescription-only) that tell the two processes apart.
  * T5's box listed "education" twice (E and G); G is not an answer and is
    dropped so the list has no duplicate.
  * T4 paragraphs K and L had their letter split off on a line of its own.
  * T1 option "Children Accident Prevention Trust" spelt as in the passage.

Keys (accept what the passage says, inside the word limit)
  * T4 Q7  FALSE -> TRUE: "the brome relied on farmers to resow its seeds"
    and it is "unwilling to release its seeds as they ripen".
  * T4 Q21 TRUE -> FALSE: engineering, not flooding, shortened the Rhine
    ("German engineers have erased its backwaters ... the river has lost 7
    percent of its original length"); the flooding is the result.
  * T2 Q13 also "Port Jackson" (the "second location" the fleet moved to).
  * T3 Q22 also "lost time" ("stress causes the most lost time").
  * T6 Q22 also "complexity" ("the complexity and too much information").
  * T4 Q25 drops "new breed" (the people are the "soft engineers").
  * T5 Q12 drops "qualitative descriptions" (does not fit "a ___ way").
"""
import json
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])


def load(kind, tid):
    return json.loads((root / "content" / kind / f"{tid}.json").read_text("utf8"))


def save(kind, tid, data, indent=None):
    (root / "content" / kind / f"{tid}.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=indent), "utf8")


NOTES = {
    "v5r1": ("Questions 33–37", [
        "<b>Packaging in pharmaceutical industry</b>",
        "<b>Designs for over-the-counter medicines</b>",
        "• First, {{33}} make the proposal,",
        "• then pass them to the {{34}}",
        "• Finally, these designs will be tested by {{35}}",
        "<b>Prescription-only</b>",
        "• First, the design is made by {{36}} and then subjected to {{37}}",
    ]),
    "v5r3": ("Questions 36–40", [
        "<b>Sir Walter Scott and Robert Louis Stevenson</b>",
        "A lot of people believe that Sir Walter Scott and Robert Louis Stevenson are the most influential "
        "writer in the history of Scotland, but Sir Walter Scott is more proficient in {{36}}, while Stevenson "
        "has better {{37}}. Scott's books illustrate {{38}} especially in terms of tragedy, but a lot of readers "
        "prefer Stevenson's {{39}}. What's more, Stevenson's understanding of {{40}} made his works have the most "
        "unique expression of Scottish people.",
    ]),
    "v5r5": ("Questions 27–31", [
        "Of the world's 6,500 living languages, about half of them are expected to be extinct. Most of the "
        "world's languages are spoken by a {{27}} of people. However, Professor Turin set up a project WOLP to "
        "prevent {{28}} of the languages. The project provides the community with {{29}} to enable people to "
        "record their endangered languages. The oral tradition has great cultural {{30}}. An important {{31}} "
        "between languages spoken by few people and languages with celebrated written documents existed in "
        "many communities.",
    ]),
}

KEYFIX = {
    "v5r4": {"7": {"accept": ["TRUE"], "display": "TRUE"},
             "21": {"accept": ["FALSE"], "display": "FALSE"}},
}
# the corrected answers show the line that settles them
EVIDENCE = {
    "7": "this species is also unwilling to release its seeds as they ripen",
    "21": "For two centuries, German engineers have erased its backwaters and cut it off from its flood plain.",
}
ADD = {"v5r2": {"13": ["Port Jackson"]}, "v5r3": {"22": ["lost time"]}, "v5r6": {"22": ["complexity"]}}
DROP = {"v5r4": {"25": ["new breed"]}, "v5r5": {"12": ["qualitative descriptions"]}}
DISPLAY = {"v5r5": {"11": "conclusion", "12": "qualitative"}}


def notes(tid, title, lines):
    t = load("tests", tid)
    k = load("keys", tid)
    for s in t["sections"]:
        for g in s["groups"]:
            if g.get("title") != title or not g.get("questions"):
                continue
            if tid == "v5r5":
                g["bank"] = [b for b in g["bank"] if b[0] != "G"]
            words = dict(g["bank"])
            for q in g["questions"]:
                n = str(q["n"])
                letter = k[n]["accept"][0]
                k[n] = {"accept": [letter, words[letter]], "display": f"{letter} — {words[letter]}"}
            g.pop("questions")
            g["lines"] = lines
            print(tid, title, "shown once with the word box")
    save("tests", tid, t)
    save("keys", tid, k, 1)


def main():
    for tid, (title, lines) in NOTES.items():
        notes(tid, title, lines)

    t = load("tests", "v5r1")
    s = json.dumps(t, ensure_ascii=False).replace("Children Accident Prevention Trust",
                                                  "Child Accident Prevention Trust")
    save("tests", "v5r1", json.loads(s))

    t = load("tests", "v5r4")
    paras = t["sections"][0]["passage"]["paras"]
    out = []
    for p in paras:
        if out and isinstance(out[-1], str) and re.fullmatch(r"<b>[A-Z]</b>", out[-1]):
            out[-1] = f"{out[-1]}&nbsp; {p}"
        else:
            out.append(p)
    if len(out) != len(paras):
        t["sections"][0]["passage"]["paras"] = out
        save("tests", "v5r4", t)
        print("v5r4 paragraph letters K and L rejoined to their text")

    ev = load("evidence", "v5r4")
    for q, line in EVIDENCE.items():
        if line not in ev[q]["t"]:
            ev[q]["t"].append(line)
    save("evidence", "v5r4", ev, 1)

    for tid in sorted(set(KEYFIX) | set(ADD) | set(DROP) | set(DISPLAY)):
        k = load("keys", tid)
        for q, v in KEYFIX.get(tid, {}).items():
            k[q] = v
        for q, extra in ADD.get(tid, {}).items():
            for a in extra:
                if a.lower() not in {x.lower() for x in k[q]["accept"]}:
                    k[q]["accept"].append(a)
            k[q]["display"] = " / ".join(dict.fromkeys(
                [x.strip() for x in k[q]["display"].split(" / ")] + extra))
        for q, gone in DROP.get(tid, {}).items():
            k[q]["accept"] = [a for a in k[q]["accept"] if a.lower() not in {g.lower() for g in gone}]
            k[q]["display"] = k[q]["accept"][0]
        for q, d in DISPLAY.get(tid, {}).items():
            k[q]["display"] = d
        save("keys", tid, k, 1)
        print(tid, "key updated")


if __name__ == "__main__":
    main()
