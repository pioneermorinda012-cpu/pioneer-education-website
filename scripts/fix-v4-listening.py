"""Volume 4 listening: accept what is actually said, within the word limit.

Run after scripts/import-listening-html.py. The papers came with synonyms as
alternatives ("rude" for impolite, "punctually" for promptly, "prize" for
reward). IELTS listening marks the word on the recording, so those go.
"""
import json, sys, pathlib
root = pathlib.Path(sys.argv[1])
KEYS = {
    "v4l1": {
        "3": (["6 days", "six days"], "6 days"),
        "17": (["garden shed", "the garden shed"], "garden shed"),
        "22": (["too long"], "too long"),
        "38": (["local product", "local products"], "local product"),
        "40": (["mature cheeses", "cheeses"], "mature cheeses"),
    },
    "v4l2": {
        "2": (["impolite"], "impolite"),
        "3": (["rarely"], "rarely"),
        "5": (["promptly"], "promptly"),
        "7": (["attend meeting", "attend meetings"], "attend meeting(s)"),
        "27": (["deposited"], "deposited"),
        "28": (["display"], "display"),
        "29": (["distribute"], "distribute"),
        "30": (["reward"], "reward"),
        "37": (["pipe work", "pipework", "pipe-work"], "pipe work"),
        "38": (["almost double", "double"], "(almost) double"),
        "39": (["one quarter", "a quarter"], "one quarter"),
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
