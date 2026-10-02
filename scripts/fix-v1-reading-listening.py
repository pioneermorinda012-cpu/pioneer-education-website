"""Tighten the keys of Volume 1 Reading 1-6 and Listening 3 & 6 after import.

    python scripts/fix-v1-reading-listening.py <repo-root>

Rule, as for every paper on the site: accept what the passage or recording
actually says, inside the word limit. Variants the papers added that the text
never says (plurals/singulars it doesn't use, synonyms, over-length answers)
are dropped. Reading Test 6 Q20/Q21 are swapped to match the diagram: arrow 20
points at the ball, arrow 21 at the powder inside it.
"""
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])

DROP = {
    "v1r1": {"21": ["2000 flooding", "flooding"], "35": ["life cycle"], "36": ["drought"]},
    "v1r2": {"35": ["eosuchian"], "36": ["long bones"]},
    "v1r3": {"33": ["fruits", "forest fruits"], "34": ["fruits", "forest fruits"],
             "35": ["uxi trees"], "37": ["piquia tree"]},
    "v1r5": {"14": ["rhymes and stories", "stories and rhymes"], "18": ["adventure"],
             "38": ["droplet"], "39": ["lamination and packing process"], "40": ["grape farmers"]},
    "v1l3": {"4": ["hot steam"], "17": ["food container"], "28": ["material"], "29": ["images"],
             "30": ["advertisements", "advertising"], "35": ["smoother"], "36": ["rubber tyres", "rubber tires"],
             "37": ["safety"]},
    "v1l6": {"19": ["package label", "label"], "38": ["scared of", "frightened of"]},
}
SET = {
    "v1r1": {"21": "2000 floods", "35": "life cycles", "36": "droughts"},
    "v1r6": {},
}


V1R3_Q9 = {
    "title": "Questions 9–13",
    "instr": "Complete the summary below using words from the box.<br><b>Word box:</b> less · more · observer · "
             "social · cacher · Jay · remembered · watched · nutcracker · solitary",
    "lines": [
        "While the Nutcracker is more able to cache seeds, the Jay relies {{9}} on caching food and is thus less "
        "specialised in this ability, but more {{10}}. To study their behaviour of caching and finding their caches, "
        "an experiment was designed and carried out to test these two birds for their ability to remember where they "
        "hid the seeds.",
        "In the experiment, the cacher bird hid seeds in the ground while the other {{11}}. As a result, the "
        "Nutcracker and the Mexican Jay showed different performance in the role of {{12}} at finding the seeds – the "
        "observing {{13}} didn't do as well as its counterpart.",
    ],
}


def word_box_summary():
    """The paper wrote Q9-13 as five dropdowns that each repeat the whole summary,
    with the words as values the player can't submit. Show the summary once with
    five gaps and the box above it, as on the exam paper."""
    p = root / "content" / "tests" / "v1r3.json"
    if not p.exists():
        return
    t = json.loads(p.read_text("utf8"))
    groups = t["sections"][0]["groups"]
    for i, g in enumerate(groups):
        if g.get("title") == "Questions 9–13" and g.get("questions"):
            groups[i] = V1R3_Q9
            p.write_text(json.dumps(t, ensure_ascii=False), "utf8")
            print("v1r3 Q9-13 shown as one summary with a word box")


def main():
    word_box_summary()
    for tid, drops in DROP.items():
        p = root / "content" / "keys" / f"{tid}.json"
        if not p.exists():
            continue
        key = json.loads(p.read_text("utf8"))
        for q, gone in drops.items():
            k = key[q]
            k["accept"] = [a for a in k["accept"] if a.lower() not in {g.lower() for g in gone}]
            if q in SET.get(tid, {}):
                k["display"] = SET[tid][q]
        p.write_text(json.dumps(key, ensure_ascii=False, indent=1), "utf8")
        print(tid, "tightened", ", ".join(f"Q{q}" for q in drops))

    p = root / "content" / "keys" / "v1r6.json"
    if p.exists():
        key = json.loads(p.read_text("utf8"))
        if "powder" in key["20"]["accept"]:
            key["20"] = {"accept": ["rubber ball"], "display": "rubber ball"}
            key["21"] = {"accept": ["powder", "pungent powder"], "display": "(pungent) powder"}
            p.write_text(json.dumps(key, ensure_ascii=False, indent=1), "utf8")
            ev = root / "content" / "evidence" / "v1r6.json"
            e = json.loads(ev.read_text("utf8"))
            e["20"], e["21"] = e["21"], e["20"]
            ev.write_text(json.dumps(e, ensure_ascii=False, indent=1), "utf8")
            print("v1r6 Q20/Q21 matched to the diagram")


if __name__ == "__main__":
    main()
