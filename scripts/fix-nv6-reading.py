"""Correct the New Volume 6 Reading Test 2 key after it was built from the
owner's Word paper and answer sheet.

    python scripts/fix-nv6-reading.py <repo-root>

Safe to run more than once.

  * Q26: the answer sheet says "A,D" but the question has only A-C. The
    passage gives A ("others want to avoid hanging around for the delivery
    man to call") and C ("they will know where goods can be returned if
    there is a problem"), so the key is A,C.
  * Q18-22 (choose FIVE true statements): six are true. H ("Target sells
    less than Wal-Mart") is in the passage too: "Wal-Mart may have more than
    five times the annual sales of Target". Any five of A, C, D, E, F, H
    score; ticking more than five still scores nothing.
  * Q34 "Cotswold School is a ___ school": "sector" alone makes no sense
    there. Accept "state sector", "state" and "comprehensive" (the passage
    calls it "a Gloucestershire comprehensive").
"""
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
kp = root / "content" / "keys" / "nv6r2.json"
ep = root / "content" / "evidence" / "nv6r2.json"
k = json.loads(kp.read_text("utf8"))
e = json.loads(ep.read_text("utf8"))

k["26"] = {"accept": ["A,C", "C,A"], "display": "A, C  (either order)"}
line = "they will know where goods can be returned if there is a problem"
if line not in e["26"]["t"]:
    e["26"]["t"].append(line)

pool = ["A", "C", "D", "E", "F", "H"]
for i, q in enumerate(range(18, 23)):
    k[str(q)] = {"any": pool, "pick": 5, "lead": 18, "idx": i,
                 "display": "any five of A, C, D, E, F, H  (Q18–22)"}
h = "Wal-Mart may have more than five times the annual sales of Target"
if h not in e["22"]["t"]:
    e["22"]["t"].append(h)

k["34"] = {"accept": ["state sector", "state", "comprehensive"],
           "display": "state (sector) / comprehensive"}
c = "a Gloucestershire comprehensive"
if c not in e["34"]["t"]:
    e["34"]["t"].append(c)

kp.write_text(json.dumps(k, ensure_ascii=False, indent=1), "utf8")
ep.write_text(json.dumps(e, ensure_ascii=False, indent=1), "utf8")
print("nv6r2 Q18-22, Q26 and Q34 corrected")
