"""Tidy New Volume 7 Reading Tests 1-2 after import.

    python scripts/fix-nv7-reading.py <repo-root>

Safe to run more than once.

Q23-26 in both tests ("choose the correct answer or answers"): the paper's
HTML lost options B and C of every question, so only A showed. Each question
is shown with all three options and a box for the letter(s). The answer may
be one letter or two; two letters are accepted in either order (A,B or B,A),
and marking ignores spaces and commas as usual. Same repair as New Volume 8.

Test 1 Q35 accepts the American spelling "moisturizer" as well as the
passage's "moisturiser"; IELTS accepts either spelling.
"""
import json
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])

QS = {
    "nv7r1": [
        (23, "Craig Venter",
         ["is the only person to have read his own genetic code.", "owns a floating laboratory.",
          "disagrees with Darwin's Theory of Evolution."]),
        (24, "Craig Venter's pilot project",
         ["took place in the Sargasso Sea.", "ended at the Galapagos Islands.",
          "gave him the idea of writing his autobiography."]),
        (25, "Synthetic Genomics, owned by Venter, hopes to",
         ["make fuel from carbon dioxide.", "produce hydrogen.", "discover more species of microbe."]),
        (26, "Before Venter's study, it was thought that",
         ["nutrient levels depended on the number of organisms that eat carbon.",
          "certain viruses keep microbe levels under control.",
          "bacteria might be responsible for climate change."]),
    ],
    "nv7r2": [
        (23, "The writer says that Daniel Radcliffe",
         ["looks taller without his glasses.", "behaves very professionally.",
          "doesn't read reviews of his acting."]),
        (24, "Daniel Radcliffe says that he",
         ["has less money than Prince Harry.", "doesn't know how much money he has made.",
          "doesn't care how much money he has made."]),
        (25, "Daniel Radcliffe wants to play roles other than Harry Potter because",
         ["his idol, Gary Oldman, did that.", "his idol, Gary Oldman, suggested it.",
          "he doesn't want people to think he can only play Harry Potter."]),
        (26, "Daniel Radcliffe says that he has not been successful with girls because",
         ["he is still a teenager.", "they expect him to be like Harry Potter.",
          "his parents won't let him go dating."]),
    ],
}


def fix(tid, qs):
    tp = root / "content" / "tests" / f"{tid}.json"
    kp = root / "content" / "keys" / f"{tid}.json"
    t = json.loads(tp.read_text("utf8"))
    k = json.loads(kp.read_text("utf8"))
    for s in t["sections"]:
        for g in s["groups"]:
            if g.get("title") == "Questions 23–26":
                instr = re.sub(r"\s*Write the letter\(s\).*$", "", g["instr"])
                g["instr"] = instr + " Write the letter(s) in the box, e.g. <b>A</b> or <b>A,B</b>."
                g["lines"] = [
                    f"<b>{n}</b>&nbsp; {stem}<br>"
                    + "<br>".join(f"<b>{L}</b>&nbsp; {o}" for L, o in zip("ABC", opts))
                    + f"<br>Answer: {{{{{n}}}}}"
                    for n, stem, opts in qs
                ]
    for n, _, _ in qs:
        letters = re.findall(r"[ABC]", k[str(n)]["accept"][0].upper())
        acc = [",".join(letters)]
        if len(letters) == 2:
            acc.append(",".join(reversed(letters)))
        k[str(n)] = {"accept": acc,
                     "display": ", ".join(letters) + ("  (either order)" if len(letters) == 2 else "")}
    tp.write_text(json.dumps(t, ensure_ascii=False), "utf8")
    kp.write_text(json.dumps(k, ensure_ascii=False, indent=1), "utf8")
    print(tid, "Q23-26 shown with all options; two-letter answers in either order")


def main():
    for tid, qs in QS.items():
        fix(tid, qs)
    kp = root / "content" / "keys" / "nv7r1.json"
    k = json.loads(kp.read_text("utf8"))
    if "moisturizer" not in k["35"]["accept"]:
        k["35"]["accept"].append("moisturizer")
    kp.write_text(json.dumps(k, ensure_ascii=False, indent=1), "utf8")


if __name__ == "__main__":
    main()
