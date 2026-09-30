"""Volume 7 listening: accept what is actually said, within the word limit.

Run after scripts/import-listening-html.py. Dropped: words nobody says
("telecommute", "financial reward", "as a team") and fragments that no longer
answer the gap ("walk on the wall", "you have to book", "the life").
"""
import json, sys, pathlib
root = pathlib.Path(sys.argv[1])
KEYS = {
    "v7l1": {
        "20": (["work from home"], "work from home"),
        "34": (["money", "making money"], "(making) money"),
        "35": (["in teams", "teams"], "in teams"),
    },
    "v7l2": {
        "2": (["castle wall", "the castle wall"], "castle wall"),
        "3": (["book ahead"], "book ahead"),
        "5": (["older children"], "older children"),
        "6": (["life and times", "the life and times"], "life and times"),
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
