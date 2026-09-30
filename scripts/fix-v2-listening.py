"""Volume 2 listening: accept what is actually said, within the word limit.

Run after scripts/import-listening-html.py. Dropped: answers over the limit
("Birds of Prey show", "colds and flus"), words nobody says ("reptile show",
"become lost", "real world", "movement"), and a word the speaker uses only to
say what the centre does NOT do ("clean", in "unlike most centres which clean…").
"""
import json, sys, pathlib
root = pathlib.Path(sys.argv[1])
KEYS = {
    "v2l1": {
        "4": (["birds of prey"], "Birds of Prey"),
        "5": (["reptile display", "the reptile display"], "reptile display"),
        "30": (["teacher"], "teacher"),
        "31": (["regulations"], "regulations"),
        "35": (["get lost"], "get lost"),
    },
    "v2l2": {
        "3": (["walking", "light walking"], "(light) walking"),
        "13": (["disinfect", "disinfect all"], "disinfect"),
        "16": (["germs", "colds"], "germs"),
        "27": (["real life", "real-life"], "real life"),
        "36": (["attention"], "attention"),
        "38": (["motion"], "motion"),
    },
}
for tid, fixes in KEYS.items():
    kp = root / "content" / "keys" / f"{tid}.json"
    key = json.loads(kp.read_text("utf8"))
    for n, (acc, disp) in fixes.items():
        assert "accept" in key[n], (tid, n)
        key[n] = {"accept": acc, "display": disp}
    kp.write_text(json.dumps(key, ensure_ascii=False, indent=1), "utf8")
    print(f"{tid}: {len(fixes)} answers tightened")
