"""V6 Listening Test 1 Q24 is A, not C.

    python scripts/fix-v6l1-q24.py <repo-root>

"Why did Jane and Rick survey international students from three different
institutions?" They say why: "We wanted to find out the responses from a range
of international students in Australia, as opposed to the experiences at one
tertiary institution only" -> A, "They didn't want to limit their responses to
Longholm." Access to students of different ages (C) is what the choice gave
them afterwards, not the reason. The owner's answer sheet also says A.
The highlighted line in the transcript moves with the answer. Safe to re-run.
"""
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
NEW = "as opposed to the experiences at one tertiary institution only."
OLD = "That gave us access to students of different ages and different disciplines."

kp = root / "content" / "keys" / "v6l1.json"
k = json.loads(kp.read_text("utf8"))
k["24"] = {"accept": ["A"], "display": "A"}
kp.write_text(json.dumps(k, ensure_ascii=False, indent=1), "utf8")

tp = root / "content" / "transcripts" / "v6l1.json"
tr = json.loads(tp.read_text("utf8"))
for sec in tr["sections"]:
    for line in sec["lines"]:
        p = line["p"]
        if any(isinstance(x, dict) and x.get("q") == "24" and x["t"] == OLD for x in p):
            before = p[0]
            head, tail = before.split(NEW)
            line["p"] = [head, {"q": "24", "t": NEW}, tail + OLD, *p[2:]]
tp.write_text(json.dumps(tr, ensure_ascii=False), "utf8")

ep = root / "content" / "evidence" / "v6l1.json"
e = json.loads(ep.read_text("utf8"))
e["24"]["t"] = [NEW]
ep.write_text(json.dumps(e, ensure_ascii=False, indent=1), "utf8")
print("v6l1 Q24 -> A")
