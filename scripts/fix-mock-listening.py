"""Tighten the keys of the four Listening Mock Tests (mtl1-mtl4) after import,
and put them in their own "Mock Tests" set.

    python scripts/fix-mock-listening.py <repo-root>

The papers accepted many answers the speakers never say (synonyms, other
plurals, paraphrases) and some over the word limit. A student who writes one
of those in the exam is marked wrong, so they are dropped here. Spelling
variants of the same word (licence/license, barbecue/barbeque) and numbers in
words stay.
"""
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
DROP = {
    "mtl1": {"2": ["the 26th of august", "last sunday in august", "the last sunday in august"],
             "5": ["drinks", "wine drinks"], "6": ["ten per cent"], "7": ["cold food", "cold meal"],
             "11": ["recommend a", "can recommend"],
             "13": ["some form of identification", "some identification", "their identification", "id"],
             "14": ["advise"], "21": ["turn up", "arrive", "get there", "arrive there"],
             "24": ["attract attention"], "36": ["on hills", "north of the alps", "to the north of the alps"],
             "37": ["expansion of luxury trade", "the expansion of luxury trade", "trade expansion"],
             "39": ["spread quickly"]},
    "mtl2": {"1": ["receptionist assistant"], "2": ["driver's licence", "driver's license", "drivers license", "driving licences"],
             "6": ["distinctive uniform"], "7": ["personal form"], "9": ["role plays"], "10": ["video tape", "videotape"],
             "11": ["temporary visitors"], "12": ["allergy"], "13": ["medications", "current medicine"],
             "21": ["bee wax"], "22": ["avocados"], "32": ["the river thames", "thames river"],
             "33": ["three and a half million"], "37": ["a-frame legs", "a frame legs"], "38": ["wheel rim"],
             "40": ["the boarding platform"]},
    "mtl3": {"2": ["the 1st of june", "the first of june"], "6": ["things in the distance", "at a distance", "distances"],
             "7": ["when driving", "while driving", "when he drives", "when he is driving"],
             "8": ["full frames", "full framed", "full-framed", "ones with full frame", "full frame ones",
                   "full frame glasses", "full-frame glasses"],
             "9": ["less likely to break", "strong frames", "strength", "durable"],
             "10": ["in cash", "pay cash", "pay in cash"], "19": ["the supply tanks"], "34": ["grandma", "granny"],
             "37": ["space out evenly", "evenly space", "spread out"], "38": ["football field", "soccer pitch"],
             "39": ["opening sentence"], "40": ["reading out loud", "reading it out loud", "reading aloud it"]},
    "mtl4": {"4": ["no-smoking"], "6": ["silence", "quietness", "silent"], "8": ["parties"],
             "9": ["6 o'clock in the morning"], "10": ["the front door key"], "13": ["venues"], "15": ["sundays"],
             "16": ["saturdays"], "17": ["coaches"], "18": ["bbq", "bbq dinner", "barbecue party"], "19": ["mvps"],
             "20": ["confirmation letter", "confirm letter", "confirmed letters", "confirmation"],
             "23": ["get an extension", "ask for extension", "ask for an extension", "extend his thesis deadline",
                    "extend the thesis deadline"],
             "24": ["books", "materials", "reading material", "reference books", "academic journals"],
             "31": ["shooting stars"], "39": ["the 30th of june"], "40": ["sixty five million"]},
}
for tid, drops in DROP.items():
    p = root / "content" / "keys" / f"{tid}.json"
    if not p.exists():
        continue
    key = json.loads(p.read_text("utf8"))
    for q, gone in drops.items():
        key[q]["accept"] = list(dict.fromkeys(a for a in key[q]["accept"] if a.lower() not in gone))
    p.write_text(json.dumps(key, ensure_ascii=False, indent=1), "utf8")

    tp = root / "content" / "tests" / f"{tid}.json"
    t = json.loads(tp.read_text("utf8"))
    n = int(tid[3:])
    t["catalogue"]["set"] = "Mock Tests"
    t["name"] = f"Mock Test {n} — Listening"
    tp.write_text(json.dumps(t, ensure_ascii=False), "utf8")
    print(tid, "tightened", len(drops), "answers; set Mock Tests")
