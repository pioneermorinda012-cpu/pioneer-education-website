"""Turn a raw HTML <table> left inside a group's "lines" into the group's table.

    python scripts/fix-html-tables.py <repo-root>

Some HTML papers write a "complete the table" task as a real <table>. The
reading converter kept it as one line of text, so the Player flattened it into
a single paragraph with the gaps run together. The Player draws a proper table
from group.table (rows of cells, header cells as {"t", "h": true}), so move it
there. Text before or after the table stays in lines. Safe to run again.
"""
import html as H
import json
import pathlib
import re
import sys

ROW = re.compile(r"<tr\b[^>]*>(.*?)</tr>", re.S)
CELL = re.compile(r"<(t[hd])\b([^>]*)>(.*?)</t[hd]>", re.S)


def to_table(src: str) -> list:
    rows = []
    for rm in ROW.finditer(src):
        row = []
        for tag, attrs, body in CELL.findall(rm.group(1)):
            t = re.sub(r"\s+", " ", body).strip()
            span = re.search(r'colspan="(\d+)"', attrs)
            if tag == "th" or span:
                cell = {"t": t}
                if tag == "th":
                    cell["h"] = True
                if span and int(span.group(1)) > 1:
                    cell["span"] = int(span.group(1))
                row.append(cell)
            else:
                row.append(t)
        if row:
            rows.append(row)
    return rows


def fix_group(g: dict) -> bool:
    lines = g.get("lines") or []
    hit = next((i for i, l in enumerate(lines) if isinstance(l, str) and "<table" in l), None)
    if hit is None or g.get("table"):
        return False
    line = lines[hit]
    m = re.search(r"<table\b.*?</table>", line, re.S)
    before, after = line[: m.start()].strip(), line[m.end():].strip()
    g["table"] = to_table(m.group(0))
    rest = lines[:hit] + [x for x in (before,) if x] + [x for x in (after,) if x] + lines[hit + 1:]
    if rest:
        g["lines"] = rest
    else:
        g.pop("lines")
    return True


def main():
    root = pathlib.Path(sys.argv[1])
    for p in sorted((root / "content" / "tests").glob("*.json")):
        t = json.loads(p.read_text("utf8"))
        n = sum(fix_group(g) for s in t["sections"] for g in s.get("groups", []))
        if n:
            p.write_text(json.dumps(t, ensure_ascii=False), "utf8")
            print(f"{p.stem}: {n} table(s) moved out of the lines")


if __name__ == "__main__":
    main()
