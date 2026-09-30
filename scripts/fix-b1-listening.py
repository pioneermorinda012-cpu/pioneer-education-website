"""Book 1 listening: put back the wording round the gaps that carries no gap of its own.

The converter keeps only lines that hold an answer box, which is right for a
reading summary but loses the form title and the "Students must:" lead-in here,
and a gap with no lead-in is a gap nobody can answer.
"""
import json, sys, pathlib
root = pathlib.Path(sys.argv[1])
p = root / "content" / "tests" / "b1l1.json"
t = json.loads(p.read_text("utf8"))
g = t["sections"][0]["groups"][1]
assert g["title"] == "Questions 6–10"
g["heading"] = "Personal details form"
g = t["sections"][2]["groups"][1]
assert g["title"] == "Questions 26–31" and g["lines"][0].startswith("{{26}}")
g["heading"] = "Course requirements"
g["lines"] = ["<b>Tutorial paper</b> — a piece of work on a given topic. Students must:",
              {"t": "{{26}} for 25 minutes", "sub": True},
              {"t": "{{27}}", "sub": True},
              {"t": "give to lecturer for marking", "sub": True}] + g["lines"][2:]
p.write_text(json.dumps(t, ensure_ascii=False), "utf8")
print("b1l1 fixed")

# ---- keys: accept what is actually said, within the word limit ------------
# The papers came with generous accept-lists. Real IELTS marking takes the words
# on the recording, spelt right, inside the word limit — nothing it doesn't hear
# ("noise" was never said in b1l2 Q7), nothing over three words.
KEYS = {
    "b1l1": {
        "10": (["65", "£65", "sixty-five", "sixty five"], "65"),
        "14": (["250 million", "$250 million", "250,000,000", "250000000"], "250 million"),
        "15": (["road system", "road systems"], "road system"),
        "16": (["too late"], "too late"),
        "17": (["school children", "schoolchildren", "school-children"], "school children"),
        "19": (["boats", "pleasure craft"], "boats / pleasure craft"),
        "26": (["give a talk", "give talk", "talk"], "give a talk"),
        "27": (["write up", "write up work"], "write up (work)"),
        "28": (["can choose", "you can choose", "own choice", "students choose", "student's choice"], "can choose"),
        "31": (["employment", "vocational", "work"], "employment / vocational"),
    },
    "b1l2": {
        "1": (["student hostel", "hostel", "a student hostel", "student hostels"], "(student) hostel"),
        "2": (["awful food", "food awful", "food was awful", "awful"], "awful food"),
        "3": (["not friendly", "unfriendly", "not very friendly", "not really friendly",
               "keep to themselves", "kept to themselves"], "not friendly / keep to themselves"),
        "4": (["lecturers busy", "lecturers too busy", "lecturers were busy", "busy lecturers",
               "not enough contact"], "lecturers busy / not enough contact"),
        "7": (["young children", "children", "three young children", "difficult to study"],
              "(young) children / difficult to study"),
        "9": (["computing", "bachelor of computing"], "(Bachelor of) Computing"),
        "15": (["town riding", "most town riding"], "(most) town riding"),
        "17": (["similar"], "similar"),
        "30": (["bananas ripen", "bananas to ripen", "bananas"], "bananas (to) ripen"),
        "39": (["the fridge", "fridge", "a fridge", "a cool place", "cool dark place", "a cool dark place"],
               "the fridge / a cool dark place"),
        "40": (["eat in moderation", "in moderation", "moderation"], "(eat) in moderation"),
        "41": (["eat lots", "eat lots of", "lots"], "eat lots (of)"),
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
