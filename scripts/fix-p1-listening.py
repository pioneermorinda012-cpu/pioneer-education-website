"""Answer keys for P1 Listening Tests 1-5 (owner's keys, 5 Oct 2026), and the
"choose TWO/THREE letters" tasks turned into single tick-box questions.

    python scripts/fix-p1-listening.py <repo-root>

Notation below: "a|b" = two accepted answers; {"multi": [lead, last, letters]}.
"""
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])

K = {
 "p1l1": {"1": "75", "2": "wood", "3": "15", "4": "cream", "5": "adjustable", "6": "cupboard", "7": "doors",
          "8": "95", "9": "Blake", "10": "B", "11": "cafe|café", "12": "7:30|7.30", "13": "disabled|the disabled",
          "14": "birds", "15": "exhibitions|art exhibitions", "16": "abstract", "17": "designer", "18": "portraits",
          "19": "two years|2 years|2 yrs|two yrs", "20": "photographs|photos", "21": "A", "22": "C", "23": "B",
          "24": "C", "25": "B", "26": "interests and style|style and interests", "27": "visuals", "28": "range",
          "29": "source|sources", "30": "content", "31": "B", "32": "B", "33": "A", "34": "microclimate",
          "35": "concentration", "36": "frost", "37": "liquid", "38": "supercooling", "39": "Mars", "40": "locations"},
 "p1l2": {"1": "B", "2": "A", "3": "C", "4": "bus station", "5": "450", "6": "noisy", "7": "Hills Avenue",
          "8": "dining room", "9": "modern|very modern", "10": "quiet", "11": "Sundays", "12": "1998",
          "13": "100,000|100000|one hundred thousand|a hundred thousand", "14": "government", "15": "research",
          "16": "Conference Centre|Conference Center", "17": "information desk", "18": "bookshop",
          "19": "King's Library|Kings Library", "20": "stamp display", "21": "B", "22": "C", "23": "A", "24": "B",
          "25": "A", "26": "organisation|organization", "27": "definition", "28": "aims", "29": "Key Skills",
          "30": "evidence", "31": "proficiency", "32": "learning", "33": "social and economic", "34": "positive",
          "35": "adults", "36": "A", "37": "A", "38": "B", "39": "C", "40": "A"},
 "p1l3": {"1": "230 South Road", "2": "18", "3": "activities and workshops|activities & workshops|activities, workshops",
          "4": "250", "5": "interactive", "6": "materials", "7": "insurance", "8": "publicity",
          "9": "programme|program", "10": "not available|unavailable", "11": "A", "12": "C", "13": "B", "14": "A",
          "15": "C", "16": "B", "17": "E", "18": "G", "19": "H", "20": "C", "21": "investigate",
          "22": "sunny, warm|sunny and warm|warm and sunny|warm, sunny", "23": "change", "24": "F", "25": "D",
          "26": "C", "27": "B", "28": {"multi": [28, 30, "BFH"]}, "31": {"multi": [31, 32, "AD"]},
          "33": {"multi": [33, 34, "BE"]}, "35": "12000|12,000", "36": "minority", "37": "all", "38": "teachers",
          "39": "evaluation|the evaluation", "40": "poor"},
 "p1l4": {"1": "19.75", "2": "theme", "3": "quiet", "4": "children", "5": "breakfast",
          "6": "sky-dive|skydive|sky dive|free sky-dive|free skydive|free sky dive", "7": "A", "8": "C", "9": "B",
          "10": "C", "11": "B", "12": "A", "13": "C", "14": "C",
          "18": "020 7562 4028|02075624028", "19": "27.50|27.5", "20": "3 hours|3 hrs|three hours",
          "21": "technique|the technique|their technique",
          "22": "questions|the questions|answering questions|answering the questions|students' questions|answering students' questions",
          "23": "solutions|the solutions|their solutions", "24": "A", "25": "B", "26": "B", "27": "C",
          "28": "ending", "29": "limitations", "30": "literature", "31": "safe", "32": "basic needs",
          "33": "local government", "34": "residents", "35": "economic", "36": "secondary school", "37": "films",
          "38": "Women's Centre|Women's Center|Womens Centre|Womens Center", "39": "skills", "40": "status"},
 "p1l5": {"1": "B", "2": "A", "3": "C", "4": "B", "5": "A", "6": "A", "7": "B", "8": {"multi": [8, 10, "BDG"]},
          "11": "June 6th|June 6|6th June|6 June", "12": "5000|5,000", "13": "transportation", "14": "low levels",
          "15": "commuter", "16": "plant trees", "17": "upgrade", "18": "border", "19": "clean fuels|cleaner fuels",
          "20": "factories", "21": "northwest|north-west|north west", "22": "spray",
          "23": "library|a library|small library|a small library", "24": "mountains", "25": "field observation",
          "26": "development", "27": "water", "28": "market town", "29": "national park", "30": "dissertation",
          "31": "requirements", "32": "private", "33": "attitudes", "34": "interviews", "35": "B", "36": "C",
          "37": "B", "38": "B", "39": "A", "40": "C"},
}
EXTRA = json.loads((pathlib.Path(__file__).parent / "p1-extra.json").read_text("utf8")) \
    if (pathlib.Path(__file__).parent / "p1-extra.json").exists() else {}

for tid, raw in K.items():
    raw = {**raw, **EXTRA.get(tid, {})}
    key = {}
    tp = root / "content" / "tests" / f"{tid}.json"
    t = json.loads(tp.read_text("utf8"))
    for q, v in raw.items():
        if isinstance(v, dict) and "multi" in v:
            a, b, letters = v["multi"]
            for i, n in enumerate(range(a, b + 1)):
                key[str(n)] = {"any": list(letters), "pick": b - a + 1, "lead": a, "idx": i,
                               "display": f"{', '.join(letters)}  (Q{a}–{b}, any order)"}
            # one tick-box task instead of separate dropdowns
            for s in t["sections"]:
                for g in s["groups"]:
                    qs = [x["n"] for x in g.get("questions", [])]
                    if a in qs and not any(x.get("multi") for x in g["questions"]):
                        g["questions"] = [{"n": a, "multi": True, "stem": ""}]
        elif isinstance(v, dict) and "pool" in v:
            for n in v["pool"]:
                key[str(n)] = {"accept": v["accept"], "display": " / ".join(v["accept"][:1]) + "  (any order)",
                               "pool": [str(x) for x in v["pool"]]}
        else:
            acc = v.split("|")
            key[q] = {"accept": acc, "display": " / ".join(acc[:2]) if len(acc) > 1 else acc[0]}
    key = {k: key[k] for k in sorted(key, key=int)}
    (root / "content" / "keys" / f"{tid}.json").write_text(json.dumps(key, ensure_ascii=False, indent=1), "utf8")
    tp.write_text(json.dumps(t, ensure_ascii=False), "utf8")
    print(tid, len(key), "answers")
