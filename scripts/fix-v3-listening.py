"""Volume 3 listening: accept what is actually said, within the word limit.

Run after scripts/import-listening-html.py. Dropped: answers over the limit
("young working class men" is four words), words nobody says ("straight away",
"Dr Dorfman", "nicotine", "ideal conditions", "in space"), and answers that break
the sentence ("formed from the the bottom up").
"""
import json, sys, pathlib
root = pathlib.Path(sys.argv[1])
KEYS = {
    "v3l1": {
        "2": (["car salesman", "a car salesman", "salesman"], "car salesman"),
        "6": (["immediately"], "immediately"),
        "13": (["test", "a test"], "(a) test"),
        "28": (["not stable", "unstable"], "not stable"),
        "30": (["health problems", "health", "age", "his age"], "health problems / age"),
        "35": (["solidifies", "solidify"], "solidifies"),
        "40": (["bottom up", "bottom-up"], "bottom up"),
    },
    "v3l2": {
        "5": (["Professor Dorfman", "Prof Dorfman", "Prof. Dorfman", "Dorfman"], "Professor Dorfman"),
        "8": (["interesting title", "an interesting title", "title", "a title"], "(an) interesting title"),
        "9": (["short CV", "a short CV", "CV", "a CV"], "(a) short CV"),
        "11": (["medicine"], "medicine"),
        "12": (["China", "southern China", "China and India"], "(southern) China"),
        "13": (["a very good price", "very good price"], "(a) very good price"),
        "15": (["perfect conditions", "well established", "became well established"],
               "perfect conditions / well established"),
        "16": (["production costs", "cost of production", "production cost", "costs of production"],
               "cost of production"),
        "17": (["Second World War", "the Second World War", "World War II", "World War Two", "WWII", "WW2"],
               "the Second World War"),
        "21": (["human activities", "human activity"], "human activities"),
        "22": (["get warmer"], "get warmer"),
        "27": (["above us", "orbiting the Earth", "orbits the Earth"], "above us / orbiting the Earth"),
        "32": (["smoking"], "smoking"),
        "33": (["working class men", "working-class men", "young men"], "(young) working class men"),
        "34": (["saturated fats", "saturated fat"], "saturated fats"),
        "35": (["the sun", "sun"], "the sun"),
        "37": (["healthy lifestyle choices", "lifestyle choices"], "healthy lifestyle choices"),
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
