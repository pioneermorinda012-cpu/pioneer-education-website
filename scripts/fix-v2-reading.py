"""Tighten the keys of Volume 2 Reading Tests 1-4 after import.

    python scripts/fix-v2-reading.py <repo-root>

Accept what the passage says, inside the word limit: forms the passage never
uses (singular/plural) and answers over the limit ("the" counts as a word)
are dropped.
"""
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
DROP = {
    "v2r1": {"7": ["new zealand carrageen", "the new zealand carrageens"], "10": ["cough mixtures"],
             "39": ["the missionaries and traders", "missionaries and the traders", "the missionaries and the traders"]},
    "v2r2": {"2": ["the jungles of south-east asia"], "3": ["mass of hard seeds"], "32": ["pilgrimages"]},
    "v2r3": {"10": ["the razorback sucker"], "30": ["the principle of ease"]},
}
for tid, drops in DROP.items():
    p = root / "content" / "keys" / f"{tid}.json"
    if not p.exists():
        continue
    key = json.loads(p.read_text("utf8"))
    for q, gone in drops.items():
        key[q]["accept"] = [a for a in key[q]["accept"] if a.lower() not in gone]
    p.write_text(json.dumps(key, ensure_ascii=False, indent=1), "utf8")
    print(tid, "tightened", ", ".join(f"Q{q}" for q in drops))
