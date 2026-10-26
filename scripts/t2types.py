"""Give every Task 2 question its essay type, for the category tabs.

    python scripts/t2types.py <repo-root>

Writes "types" beside "prompts" in content/writing/task2.json, one per
question: agree (agree/disagree), discuss (discuss both views and give your
opinion), adv (advantages/disadvantages, outweigh, positive or negative
development), problem (causes/effects/problems and solutions), two (any other
two-part question). Questions the patterns get wrong are fixed in OVERRIDE.
Safe to run again; run it after adding new Task 2 topics.
"""
import json, pathlib, re, sys

OVERRIDE = {
    ("w2-36", 1): "agree",    # "Discuss this statement and give your opinion" - one statement, not two views
    ("w2-24", 2): "discuss",  # two views stated, no question printed
    ("w2-43", 0): "two",      # reasons + how to research it: no problem to solve
    ("w2-05", 0): "problem",  # causes and effects of water pollution
    ("w2-11", 1): "problem",  # reasons for immigration and its consequences
    ("w2-64", 0): "two",      # causes + "do you agree": a two-part question, not agree/disagree
}

def kind(p):
    l = p.lower()
    if re.search(r"advantages?\b.*disadvantages?|outweigh|positive or (a )?negative (development|trend)", l):
        return "adv"
    if re.search(r"discuss both|discuss (these|the two) |both (these |of these )?views", l) or (
            re.search(r"\bothers\b", l) and re.search(r"what is your opinion|which (view|opinion)", l)):
        return "discuss"
    if re.search(r"agree or disagree|do you agree|extent do you agree", l):
        return "agree"
    if re.search(r"solution|what can (be done|we do)|(can|should)(/should)? be done|what (measures|steps)|how (can|could|should) "
                 r"(we|this|these|the|governments|people|it) (be )?(reduce|solve|tackle|help|deal)|solve|recommendations|"
                 r"what should .* do|counter this", l):
        return "problem"
    return "two"

root = pathlib.Path(sys.argv[1])
p = root / "content" / "writing" / "task2.json"
d = json.loads(p.read_text("utf8"))
for e in d:
    e["types"] = [OVERRIDE.get((e["id"], i)) or kind(q) for i, q in enumerate(e["prompts"])]
p.write_text(json.dumps(d, ensure_ascii=False, indent=1), "utf8")
from collections import Counter
print(Counter(t for e in d for t in e["types"]))
