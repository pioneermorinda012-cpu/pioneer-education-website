"""Import a batch of hand-authored GT Reading HTML papers.

The converter in import-html-test.py does one file. This is the list of which
file becomes which test, so a whole volume can be brought in with one command
and nobody has to remember that "Master Volume 4 Test 2" is gtm4r2.

    python scripts/import-gt.py <repo-root> <folder-of-html-files>

Every paper is checked before it is written: forty question slots, forty keys,
an authored mark for every question, each mark's sentence present in its own
passage word for word, and every letter answer among that question's options. A
paper that fails any of those is reported and not written, because a test that
marks a student wrong for the right answer is worse than no test at all.
"""
import html as _html
import json
import pathlib
import re
import shutil
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import importlib
_conv = importlib.import_module("import-html-test")

# file stem  ->  (test id, set code, set label, order in the set)
BATCH = [
    ("Volume_4_Test1",        "gt4r1",  "GT4",  1),
    ("Volume_4_Test2",        "gt4r2",  "GT4",  2),
    ("Volume_5_Test1",        "gt5r1",  "GT5",  1),
    ("Volume_5_Test2",        "gt5r2",  "GT5",  2),
    ("Volume_6_Test1",        "gt6r1",  "GT6",  1),
    ("Volume_6_Test2",        "gt6r2",  "GT6",  2),
    ("Volume_8_Test1",        "gt8r1",  "GT8",  1),
    ("Master_Volume_1_Test1", "gtm1r1", "GTM1", 1),
    ("Master_Volume_1_Test2", "gtm1r2", "GTM1", 2),
    ("Master_Volume_2_Test1", "gtm2r1", "GTM2", 1),
    ("Master_Volume_2_Test2", "gtm2r2", "GTM2", 2),
    ("Master_Volume_3_Test1", "gtm3r1", "GTM3", 1),
    ("Master_Volume_3_Test2", "gtm3r2", "GTM3", 2),
    ("Master_Volume_4_Test1", "gtm4r1", "GTM4", 1),
    ("Master_Volume_4_Test2", "gtm4r2", "GTM4", 2),
    ("Master_Volume_5_Test1", "gtm5r1", "GTM5", 1),
    ("Master_Volume_5_Test2", "gtm5r2", "GTM5", 2),
    ("Master_Volume_6_Test1", "gtm6r1", "GTM6", 1),
    ("Master_Volume_6_Test2", "gtm6r2", "GTM6", 2),
]

TAG = re.compile(r"<[^>]+>")


def flat(paras) -> str:
    joined = " ".join(p if isinstance(p, str) else p["t"] for p in paras)
    joined = re.sub(r"<br\s*/?>", " ", joined)
    # The passages keep their markup, so &gt; and &nbsp; are still escaped here
    # while the evidence sentence was decoded when it was lifted out. Decode
    # both the same way or a perfectly good mark inside a table reads as a fault.
    joined = _html.unescape(TAG.sub("", joined)).replace("\u00a0", " ")
    return re.sub(r"\s+", " ", joined).strip()


def check(test: dict, key: dict, ev: dict) -> list[str]:
    """Everything that must be true before a paper is allowed near a student."""
    problems = []

    slots, opts_of = [], {}
    for s in test["sections"]:
        for g in s["groups"]:
            for line in g.get("lines", []):
                slots += [int(x) for x in re.findall(r"\{\{(\d+)\}\}", str(line))]
            for row in g.get("table", []):
                for cell in row:
                    t = cell["t"] if isinstance(cell, dict) else cell
                    slots += [int(x) for x in re.findall(r"\{\{(\d+)\}\}", t)]
            for q in g.get("questions", []):
                slots.append(q["n"])
                opts_of[str(q["n"])] = [o if isinstance(o, str) else o["l"]
                                        for o in q.get("opts", [])]

    missing = sorted(set(range(1, 41)) - set(slots))
    if missing:
        problems.append(f"no answer box for {missing}")
    if len(key) != 40:
        problems.append(f"{len(key)} answers in the key, expected 40")

    no_ev = sorted(set(range(1, 41)) - {int(k) for k in ev})
    if no_ev:
        problems.append(f"nothing marked in the passage for {no_ev}")

    texts = [flat(s["passage"]["paras"]) for s in test["sections"]]
    for q, e in ev.items():
        for frag in e["t"]:
            if frag and frag not in texts[e["s"]]:
                problems.append(f"Q{q}: marked sentence is not in section {e['s'] + 1}")
                break

    for q, k in key.items():
        want = k.get("accept") or k.get("any") or []
        o = opts_of.get(q)
        if o == []:
            problems.append(f"Q{q}: a choice question with no choices")
        elif o:
            for w in want:
                # the display string carries the heading text after an em dash
                letter = str(w).split(" — ")[0]
                if letter not in o:
                    problems.append(f"Q{q}: answer {letter!r} is not one of {o[:8]}")
    return problems


def main() -> int:
    root = pathlib.Path(sys.argv[1])
    src = pathlib.Path(sys.argv[2])

    done, failed = [], []
    for stem, tid, set_code, order in BATCH:
        path = src / f"Pioneer_IELTS_GT_Reading_{stem}.html"
        if not path.exists():
            failed.append((tid, [f"no such file: {path.name}"]))
            continue
        label = f"Reading Test {order}"
        test, answer_key, ev = _conv.convert(path, tid, label, root)

        # the catalogue shows the skill's full name; the paper carries it too
        p = root / "content" / "tests" / f"{tid}.json"
        test = json.loads(p.read_text(encoding="utf8"))
        test["catalogue"]["skillLabel"] = "General Training Reading"
        test["name"] = f"{tid.upper()} — {label}"
        p.write_text(json.dumps(test, ensure_ascii=False), encoding="utf8")

        key = json.loads((root / "content" / "keys" / f"{tid}.json").read_text("utf8"))
        problems = check(test, key, ev)
        if problems:
            # A paper that fails its checks does not get left on disk half-right,
            # where it would quietly appear in the library. Take it back out.
            for sub in ("tests", "keys", "evidence"):
                (root / "content" / sub / f"{tid}.json").unlink(missing_ok=True)
            shutil.rmtree(root / "public" / "practice" / "media" / tid, ignore_errors=True)
        (failed if problems else done).append((tid, problems))
        flag = "  ✗ " + "; ".join(problems) if problems else "  ok"
        print(f"{tid:<7} {set_code:<5} {stem:<24}{flag}")

    # the catalogue, rewritten from scratch for these sets only
    cat_path = root / "content" / "catalogue.json"
    cat = json.loads(cat_path.read_text(encoding="utf8"))
    ours = {tid for tid, _ in done}
    cat = [c for c in cat if c["id"] not in ours]
    for stem, tid, set_code, order in BATCH:
        if tid not in ours:
            continue
        cat.append({
            "id": tid, "skill": "GR", "skillLabel": "General Training Reading",
            "set": set_code, "label": f"Reading Test {order}", "order": order,
            "name": f"{tid.upper()} — Reading Test {order}",
            "minutes": 60, "total": 40, "mode": "reading", "sections": 3,
            "keyed": True,
        })
    cat_path.write_text(json.dumps(cat, ensure_ascii=False, indent=1), encoding="utf8")

    print(f"\n{len(done)} imported, {len(failed)} rejected, {len(cat)} tests in the catalogue")
    for tid, problems in failed:
        print(f"  {tid}: {'; '.join(problems)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
