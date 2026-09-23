"""Turn one of the hand-authored GT Reading HTML papers into the site's format.

The papers are written as standalone HTML files: passage on the left, questions
on the right, an ANSWER_KEY object at the bottom, and — the part that matters —
the sentence that answers each question wrapped in the passage by hand:

    <mark class="ev" data-q="7"><sup class="qb">Q7</sup>…the sentence…</mark>

That last piece is why these are worth converting rather than re-typing. The
site used to work out where an answer lived by searching the passage for the
answer's own words, which cannot work for TRUE/FALSE or multiple choice, where
the answer is a letter. Here a person has already pointed at the line. This
script lifts that pointer out and files it separately from the passage, so the
passage a student downloads has no marks in it and the evidence only appears
once the paper has been marked on the server.

Out:  content/tests/<id>.json   the paper, no answers, no evidence
      content/keys/<id>.json    the answer key            (server only)
      content/evidence/<id>.json  where each answer lives (server only)
"""
import json
import re
import sys
import base64
import pathlib

# ---------------------------------------------------------------- html helpers

TAG = re.compile(r"<[^>]+>")


def plain(html: str) -> str:
    """Readable text, for an evidence string that has to match the passage."""
    s = re.sub(r"<br\s*/?>", " ", html)
    s = TAG.sub("", s)
    s = (s.replace("&nbsp;", " ").replace("&amp;", "&")
          .replace("&lt;", "<").replace("&gt;", ">").replace("&#39;", "'")
          .replace("&quot;", '"'))
    return re.sub(r"\s+", " ", s).strip()


def balanced(html: str, start: int, tag: str = "div") -> tuple[str, int]:
    """Inner HTML of the element opening at `start`, and the index after it.

    The papers nest divs several deep, so a regex for the closing tag finds the
    wrong one. Counting is the only thing that works.
    """
    open_end = html.index(">", start) + 1
    depth = 1
    i = open_end
    opener = re.compile(rf"<{tag}\b", re.I)
    closer = re.compile(rf"</{tag}>", re.I)
    while depth:
        o = opener.search(html, i)
        c = closer.search(html, i)
        if not c:
            raise ValueError("unclosed element")
        if o and o.start() < c.start():
            depth += 1
            i = o.end()
        else:
            depth -= 1
            i = c.end()
    return html[open_end:i - len(f"</{tag}>")], i


def top_level(html: str):
    """Walk the direct children of a fragment, yielding (tagname, attrs, inner)."""
    i = 0
    n = len(html)
    while i < n:
        lt = html.find("<", i)
        if lt == -1:
            break
        m = re.match(r"<(\w+)([^>]*)>", html[lt:])
        if not m:
            i = lt + 1
            continue
        tag, attrs = m.group(1).lower(), m.group(2)
        if tag in ("br", "img", "hr", "input"):
            yield tag, attrs, ""
            i = lt + m.end()
            continue
        try:
            inner, after = balanced(html, lt, tag)
        except ValueError:
            break
        yield tag, attrs, inner
        i = after


def cls(attrs: str) -> str:
    m = re.search(r'class="([^"]*)"', attrs)
    return m.group(1) if m else ""


def attr(attrs: str, name: str) -> str | None:
    m = re.search(rf'{name}="([^"]*)"', attrs)
    return m.group(1) if m else None


# ------------------------------------------------------------------- evidence

EV = re.compile(
    r'<mark class="ev" data-q="(\d+)">(?:<sup class="qb">[^<]*</sup>)?(.*?)</mark>',
    re.S)


def lift_evidence(html: str, into: dict, section: int) -> str:
    """Record every authored mark, then hand back the passage without them."""
    def take(m: re.Match) -> str:
        q, inner = m.group(1), m.group(2)
        # a mark may itself contain <u> or <b>; the evidence is the words
        into.setdefault(q, {"s": section, "t": []})["t"].append(plain(inner))
        return inner
    return EV.sub(take, html)


# -------------------------------------------------------------------- passage

def save_data_uri(src: str, media: dict, test_id: str, out_dir: pathlib.Path) -> str:
    """A map pasted into the page as base64 becomes a real file on disk.

    Left inline, a single map is a quarter of a megabyte of the paper that every
    student downloads before the test even starts, and it cannot be cached.
    """
    head, b64 = src.split(",", 1)
    ext = head.split("/")[1].split(";")[0]
    key = f"fig{len(media) + 1}"
    name = f"{test_id}__{key}.{ext}"
    (out_dir / name).write_bytes(base64.b64decode(b64))
    media[key] = f"/practice/media/{test_id}/{name}"
    return key


def read_passage(inner: str, section: int, evidence: dict,
                 media: dict, test_id: str, out_dir: pathlib.Path) -> dict:
    """The left-hand column: a title, then one entry per block of prose."""
    inner = lift_evidence(inner, evidence, section)
    figure: str | None = None

    def pull_img(frag: str) -> str:
        nonlocal figure
        def take(m: re.Match) -> str:
            nonlocal figure
            src = attr(m.group(1), "src") or ""
            if src.startswith("data:image/"):
                figure = save_data_uri(src, media, test_id, out_dir)
                return ""
            return m.group(0)
        return re.sub(r"<img\b([^>]*)>", take, frag)

    inner = pull_img(inner)
    title, paras = None, []

    def add(html: str):
        html = html.strip()
        if html:
            paras.append(html)

    def walk(frag: str):
        nonlocal title
        for tag, attrs, body in top_level(frag):
            c = cls(attrs)
            if tag == "h2" and title is None:
                title = plain(body)
            elif tag in ("h2", "h3"):
                add(f"<b>{body}</b>")
            elif tag == "h4":
                add(f"<b>{body}</b>")
            elif tag == "p":
                add(body)
            elif c in ("cards", "grid") or tag == "section":
                walk(body)
            elif c == "ad" or tag == "div":
                # an advertisement or a notice: its heading and its body are one
                # block on the page and must stay one block here
                head = re.search(r"<h4[^>]*>(.*?)</h4>", body, re.S)
                rest = re.sub(r"<h4[^>]*>.*?</h4>", "", body, flags=re.S).strip()
                if head:
                    add(f"<b>{head.group(1)}</b><br>{plain_blocks(rest)}")
                else:
                    add(plain_blocks(body))
            elif tag in ("ul", "ol", "table", "blockquote", "figure"):
                add(f"<{tag}{attrs}>{body}</{tag}>")
            else:
                add(body)

    def plain_blocks(frag: str) -> str:
        """Flatten a small nest of <p>s into one paragraph with line breaks."""
        out = []
        for tag, attrs, body in top_level(frag):
            out.append(body if tag in ("p", "div") else f"<{tag}{attrs}>{body}</{tag}>")
        joined = "<br>".join(x.strip() for x in out if x.strip())
        return joined or frag.strip()

    walk(inner)
    out = {"title": title or "Reading passage", "paras": paras}
    if figure:
        out["img"] = figure
    return out


# ------------------------------------------------------------------- questions

def option_list(attrs: str, body: str, kind: str):
    """The choices behind a control, as the site writes them."""
    if kind == "select":
        opts = []
        for m in re.finditer(r'<option value="([^"]*)"[^>]*>(.*?)</option>', body, re.S):
            v, t = m.group(1), plain(m.group(2))
            if not v:
                continue                       # the "— 7 —" placeholder
            opts.append(v if t == v else {"l": v, "t": t})
        return opts, False
    if kind == "btn":
        return [m.group(1) for m in re.finditer(r'class="opt-btn" data-v="([^"]*)"', body)], False
    if kind == "chip":
        return [m.group(1) for m in re.finditer(r'class="chip" data-v="([^"]*)"', body)], True
    if kind == "radio":
        opts = []
        for m in re.finditer(r'<label class="mcq">.*?value="([^"]*)".*?</label>', body, re.S):
            whole = m.group(0)
            v = m.group(1)
            t = plain(re.sub(r"<input[^>]*>", "", whole))
            t = re.sub(rf"^{re.escape(v)}\s*", "", t).strip()
            opts.append({"l": v, "t": t} if t else v)
        return opts, False
    return [], False


def read_question(attrs: str, body: str):
    """One <div class="q"> → the number, the wording, and how it is answered."""
    qt = re.search(r'<div class="qtext">(.*?)</div>', body, re.S)
    stem_html = qt.group(1) if qt else body
    num = re.search(r'<span class="qn">(\d+)</span>', stem_html)
    n = int(num.group(1)) if num else None
    stem = re.sub(r'<span class="qn">\d+</span>', "", stem_html, count=1).strip()

    rest = body[qt.end():] if qt else body
    if re.search(r'<input[^>]*type="text"', rest):
        return {"n": n, "stem": stem, "kind": "text"}
    m = re.search(r"<select\b([^>]*)>(.*?)</select>", rest, re.S)
    if m:
        opts, _ = option_list(m.group(1), m.group(2), "select")
        return {"n": n, "stem": stem, "kind": "choice", "opts": opts}
    m = re.search(r'<div class="ansgrp ([a-z]+)"([^>]*)>', rest)
    if m:
        which = m.group(1)
        inner, _ = balanced(rest, m.start(), "div")
        kind = {"btn-group": "btn", "chipgrp": "chip", "mcqgrp": "radio"}.get(
            which, {"btn": "btn", "chipgrp": "chip", "mcqgrp": "radio"}.get(which, "btn"))
        opts, multi = option_list(m.group(2), inner, kind)
        q = {"n": n, "stem": stem, "kind": "choice", "opts": opts}
        if multi:
            q["multi"] = True
            q["pick"] = int(attr(m.group(2), "data-k") or 2)
        return q
    return {"n": n, "stem": stem, "kind": "text"}


SEL_OPTS: dict[int, list] = {}


def gapify(frag: str) -> str:
    """Replace every answer control in a block with a marker the site understands.

    A typed box becomes {{n}}, which the player already draws. A dropdown
    becomes [[sel:n]] and is dealt with afterwards, because a dropdown means the
    student is picking from a printed list and must keep a list to pick from —
    turning it into a text box would change the question.
    """
    def sel(m: re.Match) -> str:
        n = int(attr(m.group(1), "data-q") or 0)
        opts, _ = option_list(m.group(1), m.group(2), "select")
        SEL_OPTS[n] = opts
        return f"[[sel:{n}]]"
    frag = re.sub(r"<select\b([^>]*)>(.*?)</select>", sel, frag, flags=re.S)
    frag = re.sub(r'<input[^>]*data-q="(\d+)"[^>]*>', lambda m: "{{%s}}" % m.group(1), frag)
    # the little number printed beside each box is the box's own label on the site
    frag = re.sub(r'<span class="qn">\d+</span>\s*', "", frag)
    return frag


BLOCK = ("div", "p", "section", "li", "td", "th")


def blocks_of(frag: str) -> list[str]:
    """One entry per visible block, so a diagram's boxes stay separate lines.

    A fragment with no block-level child is itself one block — text sitting
    loose beside a <b> or a <br> is still text, and dropping it once cost a
    whole flow chart its wording.
    """
    children = [(t, a, b) for t, a, b in top_level(frag) if t in BLOCK]
    if not children:
        t = frag.strip()
        return [t] if t else []
    out: list[str] = []
    for _, _, body in children:
        out.extend(blocks_of(body))
    return [b for b in out if b.strip()]


def stem_for(n: int, block: str) -> str:
    """The wording round one gap, with its neighbours left visible as numbers."""
    s = re.sub(r"\[\[sel:(\d+)\]\]", lambda m: " _____ " if int(m.group(1)) == n else f" ({m.group(1)}) ", block)
    s = re.sub(r"\{\{(\d+)\}\}", lambda m: f" ({m.group(1)}) ", s)
    s = re.sub(r"<br\s*/?>", " · ", s)
    return re.sub(r"\s+", " ", s).strip(" ·")


def read_questions(inner: str, media: dict, test_id: str, out_dir: pathlib.Path):
    """The right-hand column: instruction blocks, each owning the questions under it."""
    groups = []
    cur = None

    def flush():
        nonlocal cur
        if cur and (cur.get("lines") or cur.get("questions") or cur.get("table")):
            groups.append({k: v for k, v in cur.items() if v})
        cur = None

    def fresh(instr_html=""):
        nonlocal cur
        flush()
        title, body = "", instr_html
        m = re.match(r"\s*<b>(Questions?[^<]*)</b>\s*(?:<br>)?\s*", instr_html, re.S)
        if m:
            title, body = plain(m.group(1)), instr_html[m.end():]
        ex = ""
        m = re.search(r"(?:^|<br>)\s*Example:?\s*(.*?)$", body, re.S)
        if m:
            ex = m.group(1).strip()
            body = body[:m.start()]
        cur = {"title": title, "instr": body.strip(), "example": ex,
               "lines": [], "questions": [], "table": []}

    for tag, attrs, body in top_level(inner):
        c = cls(attrs)
        if c == "instr":
            fresh(body)
        elif tag == "img":
            src = attr(attrs, "src") or ""
            if src.startswith("data:image/"):
                if cur is None:
                    fresh("")
                cur["img"] = save_data_uri(src, media, test_id, out_dir)
        elif c == "q":
            if cur is None:
                fresh("")
            q = read_question(attrs, body)
            if q["kind"] == "text":
                # a one-gap short answer: the box belongs at the end of the line
                cur["lines"].append(f"{q['stem']} {{{{{q['n']}}}}}")
            else:
                entry = {"n": q["n"], "stem": q["stem"], "opts": q["opts"]}
                if q.get("multi"):
                    entry["multi"] = True
                cur["questions"].append(entry)
        elif c == "optlist":
            # the printed list of headings a flow chart or diagram picks from
            if cur is None:
                fresh("")
            cur["bank"] = [
                [plain(m.group(1)), plain(m.group(2))]
                for m in re.finditer(r"<div><b>([^<]+)</b>(?:&nbsp;)?\s*(.*?)</div>", body, re.S)
            ]
        elif tag == "table":
            if cur is None:
                fresh("")
            for row in re.finditer(r"<tr[^>]*>(.*?)</tr>", body, re.S):
                cells = []
                for cm in re.finditer(r"<(th|td)([^>]*)>(.*?)</\1>", row.group(1), re.S):
                    t = gapify(cm.group(3)).strip()
                    cell: dict = {"t": t}
                    if cm.group(1) == "th":
                        cell["h"] = True
                    span = attr(cm.group(2), "colspan")
                    if span:
                        cell["span"] = int(span)
                    cells.append(cell if len(cell) > 1 else t)
                if cells:
                    cur["table"].append(cells)
        elif tag in ("div", "section", "p", "ul", "ol"):
            # a summary, a flow chart or a diagram: gaps sitting inside prose
            if cur is None:
                fresh("")
            # any <div class="q"> inside is a question in its own right
            rest = body
            for qm in list(re.finditer(r'<div class="q"[^>]*>', body))[::-1]:
                qi, after = balanced(body, qm.start(), "div")
                q = read_question("", qi)
                if q["kind"] == "text":
                    gapped = gapify(re.search(r'<div class="qtext">(.*?)</div>', qi, re.S).group(1)
                                    if '<div class="qtext">' in qi else qi)
                    line = re.sub(r"\s+", " ", TAG.sub("", gapped)).strip()
                    if "{{" not in line:
                        line = f"{line} {{{{{q['n']}}}}}"
                    cur["lines"].insert(0, line)
                else:
                    cur["questions"].insert(0, {"n": q["n"], "stem": q["stem"], "opts": q["opts"]})
                rest = rest[:qm.start()] + rest[after:]
            for blk in blocks_of(gapify(rest)):
                sels = [int(x) for x in re.findall(r"\[\[sel:(\d+)\]\]", blk)]
                if sels:
                    for n in sels:
                        cur["questions"].append(
                            {"n": n, "stem": stem_for(n, blk), "opts": SEL_OPTS.get(n, [])})
                elif "{{" in blk:
                    cur["lines"].append(re.sub(r"\s+", " ", blk).strip())
    flush()

    # The player draws every line, then every option question, so a block that
    # mixes the two would show them out of order. Split it rather than reorder.
    tidy = []
    for g in groups:
        if g.get("lines") and g.get("questions") and not g.get("table"):
            first = {k: v for k, v in g.items() if k != "questions"}
            second = {"questions": g["questions"]}
            if min(q["n"] for q in g["questions"]) < min(
                    int(re.search(r"\{\{(\d+)\}\}", l).group(1)) for l in g["lines"]):
                first, second = second, {k: v for k, v in g.items() if k != "questions"}
            tidy.append(first)
            tidy.append(second)
        else:
            tidy.append(g)
    return tidy


# ------------------------------------------------------------------------ key

def build_key(answer_key: dict) -> dict:
    key = {}
    for n, a in answer_key.items():
        t = a.get("type")
        if t == "multiset":
            want = a["correct"] if isinstance(a["correct"], list) else [a["correct"]]
            key[n] = {"any": [str(x) for x in want], "pick": len(want),
                      "display": ", ".join(str(x) for x in want)}
        elif t == "text":
            accept = a["correct"] if isinstance(a["correct"], list) else [a["correct"]]
            key[n] = {"accept": [str(x) for x in accept],
                      "display": str(a.get("show") or accept[0])}
        else:
            c = a["correct"]
            accept = c if isinstance(c, list) else [c]
            display = str(accept[0])
            labels = a.get("labels")
            if labels and labels.get(display):
                display = f"{display} — {labels[display]}"
            key[n] = {"accept": [str(x) for x in accept], "display": display}
    return key


# ----------------------------------------------------------------------- main

BANDS = [[40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6],
         [27, 5.5], [23, 5], [19, 4.5], [15, 4], [12, 3.5], [9, 3], [6, 2.5], [0, 2]]

RULES = [
    "The passage and the questions sit side by side. Use <b>📖 Passage</b> or <b>✎ Questions</b> on a small screen to show one half full-size.",
    "You should spend about <b>20 minutes</b> on each section.",
    "Spelling must be correct — a misspelt answer is marked wrong, exactly as in the real exam.",
    "Answer all 40 questions, then tap <b>Submit test</b> for your band score.",
    "After marking, <b>every answer is highlighted in the passage</b>. Press <b>📍</b> beside any question to jump to the line it came from.",
    "A 60-minute timer runs in the background; the test submits itself at zero.",
]


def convert(src: pathlib.Path, test_id: str, label: str, root: pathlib.Path):
    html = src.read_text(encoding="utf8")

    m = re.search(r"const ANSWER_KEY\s*=\s*", html)
    start = html.index("{", m.end())
    _, end = balanced_braces(html, start)
    answer_key = json.loads(html[start:end])

    part_qs = json.loads(re.search(r"const PART_QS\s*=\s*(\[.*?\]);", html, re.S).group(1))

    media_dir = root / "public" / "practice" / "media" / test_id
    media_dir.mkdir(parents=True, exist_ok=True)
    media: dict = {}
    evidence: dict = {}
    sections = []

    for si, part in enumerate(re.finditer(r'<section class="part" id="part\d+">', html)):
        inner, _ = balanced(html, part.start(), "section")
        head = re.search(r'<div class="part-head">(.*?)</div>', inner, re.S)
        pill = re.search(r'<span class="pill">(.*?)</span>', head.group(1)) if head else None
        lo, hi = part_qs[si]

        pm = re.search(r'<div class="passage"[^>]*>', inner)
        passage_html, _ = balanced(inner, pm.start(), "div")
        passage = read_passage(passage_html, si, evidence, media, test_id, media_dir)
        passage["sub"] = f"You should spend about 20 minutes on Questions {lo}–{hi}."

        qm = re.search(r'<div class="questions">', inner)
        q_html, _ = balanced(inner, qm.start(), "div")
        groups = read_questions(q_html, media, test_id, media_dir)

        sections.append({
            "label": plain(pill.group(1)) if pill else f"Section {si + 1}",
            "qs": list(range(lo, hi + 1)),
            "passage": passage,
            "groups": groups,
        })

    for v in evidence.values():
        v["t"] = [x for x in v["t"] if x]

    test = {
        "id": test_id,
        "mode": "reading",
        "name": f"{test_id.upper()} — {label}",
        "blurb": "3 sections · 40 questions · 60 minutes",
        "minutes": 60,
        "total": 40,
        "theme": "blue",
        "bandsReading": BANDS,
        "bandsListening": BANDS,
        "rules": RULES,
        "sections": sections,
        "mediaUrls": media,
        "catalogue": {"label": label, "skillLabel": "GT Reading"},
    }

    (root / "content" / "tests" / f"{test_id}.json").write_text(
        json.dumps(test, ensure_ascii=False), encoding="utf8")
    (root / "content" / "keys" / f"{test_id}.json").write_text(
        json.dumps(build_key(answer_key), ensure_ascii=False, indent=1), encoding="utf8")
    ev_dir = root / "content" / "evidence"
    ev_dir.mkdir(exist_ok=True)
    (ev_dir / f"{test_id}.json").write_text(
        json.dumps(evidence, ensure_ascii=False, indent=1), encoding="utf8")

    return test, answer_key, evidence


def balanced_braces(html: str, start: int) -> tuple[str, int]:
    depth, i, in_str, esc = 0, start, False, False
    while i < len(html):
        ch = html[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
        elif ch == '"':
            in_str = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return html[start:i + 1], i + 1
        i += 1
    raise ValueError("unbalanced")


if __name__ == "__main__":
    root = pathlib.Path(sys.argv[1])
    src_dir = pathlib.Path(sys.argv[2])
    for i in range(1, 5):
        src = src_dir / f"Pioneer_IELTS_GT_Reading_Volume_3_Test{i}.html"
        test, akey, ev = convert(src, f"gt3r{i}", f"Reading Test {i}", root)
        slots = []
        for s in test["sections"]:
            for g in s["groups"]:
                for l in g.get("lines", []):
                    slots += [int(x) for x in re.findall(r"\{\{(\d+)\}\}", str(l))]
                for row in g.get("table", []):
                    for cell in row:
                        t = cell["t"] if isinstance(cell, dict) else cell
                        slots += [int(x) for x in re.findall(r"\{\{(\d+)\}\}", t)]
                for q in g.get("questions", []):
                    slots.append(q["n"])
        missing = sorted(set(range(1, 41)) - set(slots))
        no_ev = sorted(set(range(1, 41)) - {int(k) for k in ev}, key=int)
        print(f"gt3r{i}: {len(slots)} slots, key {len(akey)}, evidence {len(ev)}"
              f"{'  MISSING ' + str(missing) if missing else ''}"
              f"{'  NO-EV ' + str(no_ev) if no_ev else ''}")
