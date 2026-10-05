"""A worked example written as a dropdown ("Paragraph E — vii [▼]") came through
as a gap with no number, {{None}}, which split the headings task in two: the
list of headings in one group and the questions, with no instructions, in the
next. Put the example back as the group's example and rejoin the questions."""
import re


def fix_groups(groups):
    out, i = [], 0
    while i < len(groups):
        g = groups[i]
        lines = g.get("lines") or []
        ex = [l for l in lines if isinstance(l, str) and "{{None}}" in l]
        if ex:
            g["example"] = re.sub(r"\s*\{\{None\}\}", "", ex[0]).replace("<i>Example:</i> ", "")
            rest = [l for l in lines if l not in ex]
            if rest:
                g["lines"] = rest
            else:
                g.pop("lines", None)
            nxt = groups[i + 1] if i + 1 < len(groups) else None
            if nxt and set(nxt) <= {"questions", "compact"} and not g.get("questions"):
                words = {b[0]: b[1] for b in g.get("bank", [])}
                for q in nxt["questions"]:
                    q["opts"] = [o if not isinstance(o, dict) else {"l": o["l"], "t": words.get(o["l"], o["t"])}
                                 for o in q.get("opts", [])]
                g["questions"] = nxt["questions"]
                if nxt.get("compact"):
                    g["compact"] = True
                i += 1
        out.append(g)
        i += 1
    return out
