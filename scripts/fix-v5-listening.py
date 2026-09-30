"""Volume 5 listening: accept what is actually said, within the word limit.

Run after scripts/import-listening-html.py. Dropped: synonyms nobody says
("photocopier", "cell phones", "locals", "calm"), answers over the limit
("the food and the culture" is five words), and answers that break the gap
("people who are more adults only").
"""
import json, sys, pathlib
root = pathlib.Path(sys.argv[1])
KEYS = {
    "v5l1": {
        "1": (["copier", "a copier"], "copier"),
        "6": (["Mike Greene", "Greene"], "Mike Greene"),
        "7": (["fax machines", "fax machine"], "fax machines"),
        "8": (["headphones"], "headphones"),
        "9": (["mobile phones", "mobile phone"], "mobile phones"),
        "10": (["mouses", "mice", "mouse"], "mice / mouse"),
        "28": (["signature", "a signature", "stamp", "a stamp"], "signature / stamp  (Q28–29, any order)"),
        "29": (["signature", "a signature", "stamp", "a stamp"], "signature / stamp  (Q28–29, any order)"),
        "32": (["bad outcomes", "bad outcome"], "bad outcomes"),
        "35": (["community"], "community"),
        "38": (["viewership"], "viewership"),
        "40": (["adult", "mature", "grown up"], "adult / mature"),
    },
    "v5l2": {
        "4": (["under 26", "under 26 years"], "under 26"),
        "5": (["local people", "the local people"], "local people"),
        "6": (["satisfied"], "satisfied"),
        "8": (["big"], "big"),
        "10": (["food and culture", "the culture", "culture"], "food and culture"),
        "11": (["International Student Advisor", "International Student Adviser", "student advisor"],
               "International Student Advisor"),
        "12": (["study groups", "learning groups"], "study groups / learning groups"),
        "13": (["Student IT Department", "Student IT", "IT Department"], "Student IT Department"),
        "14": (["Housing Officer", "the Housing Officer"], "Housing Officer"),
        "15": (["International Department", "the International Department"], "International Department"),
        "32": (["exam performance", "performance", "their performance"], "exam performance"),
        "33": (["sleep", "sleeplessness"], "sleep / sleeplessness"),
        "37": (["be different"], "be different"),
        "38": (["marks", "marks and weighting"], "marks (and weighting)"),
        "39": (["relaxed"], "relaxed"),
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
