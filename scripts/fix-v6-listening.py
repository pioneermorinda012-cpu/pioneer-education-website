"""Volume 6 listening: accept what is actually said, within the word limit.

Run after scripts/import-listening-html.py. Dropped: synonyms nobody says
("salary", "store", "timeframe", "tourism", "East and West"), answers over the
limit ("beginning and completion date"), and fragments that no longer answer
the gap ("standard", "street", a bare "9" for a date).
"""
import json, sys, pathlib
root = pathlib.Path(sys.argv[1])
KEYS = {
    "v6l1": {
        "5": (["doorbell", "door bell", "the doorbell"], "doorbell"),
        "6": (["French teacher", "teacher"], "French teacher"),
        "8": (["long summer holiday", "long summer holidays", "a long summer holiday",
               "summer holiday", "summer holidays"], "long summer holiday"),
        "9": (["pay"], "pay"),
        "10": (["by himself", "by myself"], "by himself"),
        "16": (["nearest police station", "police station"], "nearest police station"),
        "17": (["cross street", "cross-street", "laneway"], "cross street / laneway"),
        "18": (["shop", "nearest shop", "the shop"], "shop"),
        "20": (["cancelling them", "cancelling", "canceling", "cancelling cards", "cancelling credit cards",
                "reporting them", "reporting", "reporting them stolen"], "cancelling them / reporting them"),
        "31": (["beginning", "beginning and completion", "completion date"], "beginning (and completion)"),
        "32": (["schedule", "a schedule"], "schedule"),
        "36": (["expertise", "advice", "expert advice", "advice and opinions"], "expertise / advice"),
        "38": (["standard of delivery", "standards of delivery", "delivery standards", "delivery standard"],
               "standard of delivery"),
    },
    "v6l2": {
        "14": (["9 Sept", "9 September", "9th Sept", "9th September", "September 9", "Sept 9", "9/9"], "9 Sept"),
        "17": (["14 Sept", "14 September", "14th Sept", "14th September", "September 14", "Sept 14"], "14 Sept"),
        "26": (["continuing to grow", "growing"], "continuing to grow"),
        "28": (["tourists", "tourist numbers", "number of tourists"], "tourists"),
        "30": (["Eastern and Western", "Western and Eastern"], "Eastern and Western"),
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
