"""Turn one Pioneer Academic Reading HTML paper into the site's format.

    python scripts/import-reading-html.py <repo-root> <paper.html> <test-id> "<label>" <set>

Built on import-html-test.py (passages, questions, hand-set evidence), with the
tidying the listening papers taught us applied on top:

  * "choose THREE letters" written as three dropdowns becomes one tick-box task
    worth three marks (any order, the same letter never paying twice);
  * option text no longer repeats its letter ("i – i – Early years…");
  * a gap written inside a sentence keeps one box, not two;
  * a "complete the table" task written as a real <table> becomes a table;
  * TRUE/FALSE/NOT GIVEN rows are buttons, drawn as one compact row;
  * a NOT GIVEN answer keeps no highlighted line — the absence is the lesson;
  * every highlighted line is checked against its own paragraph, word for word;
  * the paper carries the catalogue block the test page reads its heading from.
"""
import importlib
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
conv = importlib.import_module("import-html-test")
lis = importlib.import_module("import-listening-html")
tables = importlib.import_module("fix-html-tables")
import fix_examples  # noqa: E402

TF = {"TRUE", "FALSE", "NOT GIVEN", "YES", "NO"}

BANDS = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5],
         [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 2]]


def flat(p) -> str:
    t = p if isinstance(p, str) else p["t"]
    t = re.sub(r"<br\s*/?>", " ", t)
    t = conv.plain(t)
    return re.sub(r"\s+", " ", t).strip()


def main():
    root, src, tid, label, set_code = (pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]),
                                        sys.argv[3], sys.argv[4], sys.argv[5])
    html = src.read_text(encoding="utf8")
    m = re.search(r"const ANSWER_KEY\s*=\s*", html)
    body, _ = conv.balanced_braces(html, html.index("{", m.end()))
    answer_key = json.loads(body)

    test, _, evidence = conv.convert(src, tid, label, root)

    for s in test["sections"]:
        s["groups"] = fix_examples.fix_groups(s["groups"])
        for g in s["groups"]:
            for q in g.get("questions", []):
                for o in q.get("opts", []):
                    if isinstance(o, dict) and o["t"] != o["l"]:
                        o["t"] = re.sub(rf"^{re.escape(o['l'])}\s*[–-]\s*", "", o["t"])
            g["lines"] = [lis.tidy_line(l) if isinstance(l, str) else l for l in g.get("lines", [])]
            tables.fix_group(g)  # a raw <table> in a line becomes the group's table
            # The player submits a plain-string option as its POSITION letter (A, B, C...),
            # so a list of headings "i, ii, iii..." could never match a key of "iv".
            # Give each option its own label; the bank above already shows the wording.
            L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            for q in g.get("questions", []):
                o = q.get("opts") or []
                if o and all(isinstance(x, str) for x in o) and o != list(L[:len(o)]):
                    words = {b[0]: b[1] for b in g.get("bank", [])}
                    q["opts"] = [{"l": x, "t": words.get(x, x)} for x in o]
                    g["compact"] = True
            if "lines" in g and not g["lines"]:
                g.pop("lines")
            qs = g.get("questions", [])
            if qs and all({(o["l"] if isinstance(o, dict) else o) for o in q.get("opts", [])} <= TF for q in qs):
                g["compact"] = True
        lis.merge_anyof(s["groups"], answer_key)

    key = lis.build_key(answer_key)

    # NOT GIVEN keeps no line; every other line must sit inside one paragraph
    problems = []
    for q, e in evidence.items():
        acc = {a.upper() for a in key.get(q, {}).get("accept", [])}
        if acc and acc <= {"NOT GIVEN"}:
            evidence[q] = {"s": e["s"], "t": [], "k": "none"}
            continue
        paras = [flat(p) for p in test["sections"][e["s"]]["passage"]["paras"]]
        for fr in e["t"]:
            if not any(fr in p for p in paras):
                problems.append(f"Q{q}: line not found in one paragraph: {fr[:60]!r}")
        e["k"] = "exact"

    test["name"] = f"{tid.upper()} — {label}"
    test["blurb"] = "3 passages · 40 questions · 60 minutes"
    test["bandsReading"] = BANDS
    test["bandsListening"] = BANDS
    test["theme"] = "coral"
    test["catalogue"] = {"id": tid, "skill": "AR", "skillLabel": "Academic Reading", "set": set_code,
                         "label": label, "order": int(re.search(r"(\d+)$", tid).group(1))}

    (root / "content" / "tests" / f"{tid}.json").write_text(json.dumps(test, ensure_ascii=False), "utf8")
    (root / "content" / "keys" / f"{tid}.json").write_text(json.dumps(key, ensure_ascii=False, indent=1), "utf8")
    (root / "content" / "evidence" / f"{tid}.json").write_text(
        json.dumps({k: evidence[k] for k in sorted(evidence, key=int)}, ensure_ascii=False, indent=1), "utf8")
    print(f"{tid}: {len(key)} keys, {len(evidence)} evidence lines")
    for p in problems:
        print("  !", p)
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
