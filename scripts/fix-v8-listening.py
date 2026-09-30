"""Volume 8 listening: tick-boxes for "write every correct letter", and keys
that accept what is actually said, within the word limit.

Run after scripts/import-listening-html.py.

Two questions asked students to type a set of letters into a box ("B & E"),
which meant a key of thirty-two spellings and a student marked wrong for
"E,B " with a stray space. They become tick-boxes: every correct box ticked,
nothing else, for the one mark.
"""
import json, sys, pathlib
root = pathlib.Path(sys.argv[1])


def to_ticks(tid, n, opts, want, stem):
    tp = root / "content" / "tests" / f"{tid}.json"
    t = json.loads(tp.read_text("utf8"))
    for s in t["sections"]:
        gs = s["groups"]
        for i, g in enumerate(gs):
            if not any("{{%d}}" % n in (l if isinstance(l, str) else l["t"]) for l in g.get("lines", [])):
                continue
            g.pop("lines"); g.pop("bank", None)
            g["questions"] = [{"n": n, "multi": True, "opts": opts, "stem": stem}] + g.get("questions", [])
            # the untitled block that followed was only split off because of the gap
            if i + 1 < len(gs) and not gs[i + 1].get("title") and gs[i + 1].get("questions") and set(gs[i + 1]) == {"questions"}:
                g["questions"] += gs.pop(i + 1)["questions"]
            tp.write_text(json.dumps(t, ensure_ascii=False), "utf8")
            kp = root / "content" / "keys" / f"{tid}.json"
            k = json.loads(kp.read_text("utf8"))
            k[str(n)] = {"any": want, "pick": len(want), "display": ", ".join(want)}
            kp.write_text(json.dumps(k, ensure_ascii=False, indent=1), "utf8")
            return
    raise SystemExit(f"{tid} Q{n}: gap not found")


to_ticks("v8l1", 38,
         [{"l": "A", "t": "tapes"}, {"l": "B", "t": "computer programmes"}, {"l": "C", "t": "letters"},
          {"l": "D", "t": "discussions with native speakers"}, {"l": "E", "t": "newspapers and magazines"}],
         ["B", "E"], "Which can be used by independent learners? <i>(tick every correct answer)</i>")
to_ticks("v8l2", 18,
         [{"l": "A", "t": "kind"}, {"l": "B", "t": "rude"}, {"l": "C", "t": "pushy"}, {"l": "D", "t": "helpful"}],
         ["A", "D"], "The traveller found New Yorkers to be … <i>(tick every correct answer)</i>")

KEYS = {
    "v8l1": {
        "2": (["further", "further away"], "further (away)"),
        "3": (["heavy smoker", "a heavy smoker"], "heavy smoker"),
        "4": (["bus connection", "the bus connection"], "bus connection"),
        "12": (["guide", "a guide", "useful guide", "a useful guide"], "(useful) guide"),
        "19": (["free health treatment", "health treatment"], "free health treatment"),
        "20": (["write a letter", "write letter"], "write a letter"),
        "21": (["free time"], "free time"),
        "23": (["weekly or monthly", "weekly", "monthly", "weekly/monthly"], "weekly or monthly"),
        "24": (["revise"], "revise"),
        "31": (["teacher focused", "teacher-focused", "very teacher focused", "very teacher-focused"], "(very) teacher focused"),
        "35": (["identify suitable", "identify"], "identify (suitable)"),
        "37": (["initial aim", "their initial aim", "initial aims"], "(their) initial aim"),
    },
    "v8l2": {
        "7": (["unit 2", "unit two"], "Unit 2"),
        "8": (["first aid kit", "first-aid kit"], "first aid kit"),
        "11": (["from some friends", "from friends", "friends", "some friends"], "from (some) friends"),
        "12": (["by plane", "plane"], "by plane"),
        "13": (["number of foreigners", "the number of foreigners", "foreigners"], "(the) number of foreigners"),
        "14": (["changed planes", "they changed planes"], "(they) changed planes"),
        "16": (["crowds", "crowds on streets", "crowds and weather"], "crowds (and weather)"),
        "29": (["word or phrase", "word", "phrase", "word/phrase"], "word or phrase"),
        "32": (["summary"], "summary"),
        "34": (["in full"], "in full"),
        "36": (["go back"], "go back"),
        "37": (["doesn't suggest", "does not suggest", "doesnt suggest"], "doesn't suggest"),
        "38": (["omit"], "omit"),
    },
}
for tid, fixes in KEYS.items():
    kp = root / "content" / "keys" / f"{tid}.json"
    key = json.loads(kp.read_text("utf8"))
    for n, (acc, disp) in fixes.items():
        assert "accept" in key[n], (tid, n)
        key[n] = {**{k: v for k, v in key[n].items() if k == "pool"}, "accept": acc, "display": disp}
    kp.write_text(json.dumps(key, ensure_ascii=False, indent=1), "utf8")
    print(f"{tid}: {len(fixes)} answers tightened")
