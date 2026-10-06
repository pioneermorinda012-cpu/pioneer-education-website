"""Tidy New Volume 8 Reading Tests 1-2 after import.

    python scripts/fix-nv8-reading.py <repo-root>

Safe to run more than once.

Test 1 Q23-26 ("choose the correct answer or answers"): the paper's HTML lost
options B and C of every question, so only A showed. Each question is shown
with all three options and a box for the letter(s). The answer may be one
letter or two; two letters are accepted in either order (A,B or B,A), and
marking ignores spaces and commas as usual.

Keys, checked against the passages:
  * Test 1 Q35 drops "one rigid ideology" (the gap follows "a").
  * Test 2 Q31 also accepts "shortage" ("a global chocolate shortage").
  * Test 2 Q35 shows "bitter / gritty (tasting)" ("dark chocolate was bitter
    and reasonably gritty tasting"); both were already accepted.
"""
import json
import re
import pathlib
import sys

root = pathlib.Path(sys.argv[1])

Q23 = [
    (23, "People suffering from obesity may suffer from",
     ["sleep apnoea.", "diabetes.", "low blood pressure."]),
    (24, "Environmental factors contributing to obesity include",
     ["lack of exercise.", "larger portions of food at restaurants.", "comfort eating."]),
    (25, "Bad things that parents do include",
     ["using food as a reward.", "not telling children to finish their dinners.",
      "waiting before serving second portions of food."]),
    (26, "Forbidding foods is bad because children",
     ["will want them even more.", "should be offered a choice of food.", "should be treated equally."]),
]


def main():
    tp = root / "content" / "tests" / "nv8r1.json"
    kp = root / "content" / "keys" / "nv8r1.json"
    t = json.loads(tp.read_text("utf8"))
    k = json.loads(kp.read_text("utf8"))
    for s in t["sections"]:
        for g in s["groups"]:
            if g.get("title") == "Questions 23–26":
                g["instr"] = ("According to the information given in the text, choose the correct answer "
                              "<b>or answers</b> from the choices given. Write the letter(s) in the box, "
                              "e.g. <b>A</b> or <b>A,B</b>.")
                g["lines"] = [
                    f"<b>{n}</b>&nbsp; {stem}<br>"
                    + "<br>".join(f"<b>{L}</b>&nbsp; {o}" for L, o in zip("ABC", opts))
                    + f"<br>Answer: {{{{{n}}}}}"
                    for n, stem, opts in Q23
                ]
    for n, _, _ in Q23:
        letters = re.findall(r"[ABC]", k[str(n)]["accept"][0].upper())
        acc = [",".join(letters)]
        if len(letters) == 2:
            acc.append(",".join(reversed(letters)))
        k[str(n)] = {"accept": acc,
                     "display": ", ".join(letters) + ("  (either order)" if len(letters) == 2 else "")}
    tp.write_text(json.dumps(t, ensure_ascii=False), "utf8")
    kp.write_text(json.dumps(k, ensure_ascii=False, indent=1), "utf8")
    print("nv8r1 Q23-26 shown with all options; two-letter answers in either order")

    k["35"]["accept"] = [a for a in k["35"]["accept"] if a.lower() != "one rigid ideology"]
    kp.write_text(json.dumps(k, ensure_ascii=False, indent=1), "utf8")

    kp2 = root / "content" / "keys" / "nv8r2.json"
    k2 = json.loads(kp2.read_text("utf8"))
    if "shortage" not in k2["31"]["accept"]:
        k2["31"]["accept"].append("shortage")
    k2["31"]["display"] = "shortfall / deficit / shortage"
    k2["35"]["display"] = "bitter / gritty (tasting)"
    kp2.write_text(json.dumps(k2, ensure_ascii=False, indent=1), "utf8")
    print("nv8r1 Q35, nv8r2 Q31 and Q35 keys checked against the passage")


if __name__ == "__main__":
    main()
