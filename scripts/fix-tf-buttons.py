"""TRUE/FALSE/NOT GIVEN (and YES/NO/NOT GIVEN) rows typed as boxes become buttons.

The GT reading converter missed the button groups ("ansgrp btn-group" — the
hyphen defeated its pattern), so these rows arrived as a gap to type "TRUE"
into. The key is unchanged — the player submits the word itself — so earlier
attempts still mark the same.

    python scripts/fix-tf-buttons.py <repo-root>
"""
import json, pathlib, re, sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
TF = {"TRUE", "FALSE", "NOT GIVEN"}
YN = {"YES", "NO", "NOT GIVEN"}
GAP = re.compile(r"\{\{(\d+)\}\}")

total, papers, skipped = 0, 0, []
for kp in sorted((root / "content" / "keys").glob("*.json")):
    tid = kp.stem
    tp = root / "content" / "tests" / f"{tid}.json"
    if not tp.exists():
        continue
    key = json.loads(kp.read_text("utf8"))
    test = json.loads(tp.read_text("utf8"))
    word = lambda n: {a.upper() for a in key.get(n, {}).get("accept", [])}
    changed = 0
    for s in test["sections"]:
        for g in s["groups"]:
            lines = g.get("lines") or []
            gapped = [l for l in lines if GAP.search(l if isinstance(l, str) else l["t"])]
            tfl = [l for l in gapped if (lambda ns: len(ns) == 1 and word(ns[0]) and word(ns[0]) <= TF | YN)(
                GAP.findall(l if isinstance(l, str) else l["t"]))]
            if not tfl:
                continue
            if len(tfl) != len(gapped):
                skipped.append(f"{tid}: {g.get('title')} mixes typed gaps with TRUE/FALSE rows")
                continue
            yn = "<b>YES</b>" in (g.get("instr") or "") or any(word(GAP.findall(l if isinstance(l, str) else l["t"])[0]) & {"YES", "NO"} for l in tfl)
            words = ["YES", "NO", "NOT GIVEN"] if yn else ["TRUE", "FALSE", "NOT GIVEN"]
            qs = []
            for l in tfl:
                t = l if isinstance(l, str) else l["t"]
                n = int(GAP.findall(t)[0])
                stem = re.sub(r"\s+", " ", GAP.sub("", t)).strip()
                qs.append({"n": n, "stem": stem, "opts": [{"l": w, "t": w} for w in words]})
            g["lines"] = [l for l in lines if l not in tfl]
            if not g["lines"]:
                g.pop("lines")
            g["questions"] = qs + g.get("questions", [])
            g["compact"] = True
            changed += len(qs)
    if changed:
        tp.write_text(json.dumps(test, ensure_ascii=False), "utf8")
        papers += 1; total += changed
        print(f"  {tid}: {changed} rows")
print(f"{total} TRUE/FALSE rows turned into buttons across {papers} papers")
for s in skipped:
    print("  skipped:", s)
