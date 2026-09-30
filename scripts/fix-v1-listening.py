"""Volume 1 listening: accept what is actually said, within the word limit.

Run after scripts/import-listening-html.py. Real IELTS marking takes the words
on the recording, spelt right, inside the limit — not a synonym nobody said
("running shoes"), not a word from the next phrase ("sexy" models, when the gap
is the ads), not one that breaks the sentence ("controversial ads advertisements").
"""
import json, sys, pathlib
root = pathlib.Path(sys.argv[1])
KEYS = {
    "v1l1": {
        "16": (["polished stone"], "polished stone"),
        "19": (["seating", "the seating"], "seating"),
        "24": (["created order"], "created order"),
        "26": (["explained gravity"], "explained gravity"),
        "37": (["jogging shoes", "shoes"], "jogging shoes"),
        "40": (["controversial"], "controversial"),
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
