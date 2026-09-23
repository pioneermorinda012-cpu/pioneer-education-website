"""Work out where each answer lives, for the papers nobody marked up by hand.

The GT volumes arrive with the sentence behind every question already wrapped
in the passage, because a teacher did that while writing them. The older papers
on the site have nothing of the kind, and until now the site tried to work it
out live, per question, with a language model — slow, billed every time, and
broken in production. This does the same job once, offline, and writes the
answer down, so from then on it costs nothing and cannot change under anyone.

It is honest about how it knows, because the three ways are not equally sure:

  exact  The answer IS a phrase from the passage. Gap-fills, short answers,
         table and note completion are marked right only if the student copied
         the wording out, so the line can simply be looked up. This cannot be
         wrong, and it is roughly half of a typical paper.

  near   True/False and multiple choice have no such phrase — the answer is a
         letter. Here the sentence with the most wording in common with the
         question is chosen. That is what a student is taught to do: find where
         the passage talks about this. It is usually right and occasionally
         lands a sentence early or late, so it is labelled as the closest line
         rather than presented as the answer.

  none   NOT GIVEN. There is deliberately no sentence, and pointing at one
         would teach precisely the wrong lesson. These are recorded as having
         no line, so the review can say why instead of staying silent.

Papers that already carry authored marks are left alone. Run:

    python scripts/find-evidence.py <repo-root>
"""
import html as _html
import json
import pathlib
import re
import sys

TAG = re.compile(r"<[^>]+>")

STOP = set((
    "the a an and or but if of to in on at for with as by from is are was were be been "
    "being this that these those it its his her their our your my not no so very can could "
    "will would should may might do does did have has had there here them him us me he she "
    "we they you i who whom which what when where why how all any both each few more most "
    "other some such than too only own same s t just don now also into over under about "
    "after before between during through above below up down out off again further then once"
).split())

NOT_A_PHRASE = re.compile(r"^(TRUE|FALSE|YES|NO|NOT GIVEN|NOT ?GIVEN)$", re.I)
JUST_A_LABEL = re.compile(r"^([A-Za-z]|[ivxlIVXL]+)$")


def plain(html: str) -> str:
    s = re.sub(r"<br\s*/?>", " ", str(html))
    s = _html.unescape(TAG.sub(" ", s)).replace(" ", " ")
    return re.sub(r"\s+", " ", s).strip()


def stem(w: str) -> str:
    """Crude but useful: cut the ending off so a question and a passage agree.

    IELTS paraphrases on purpose, and a good half of that paraphrasing is only
    a change of ending — the question says "spending", the passage says "spend";
    the question says "endangered", the passage says "danger". Matching whole
    words alone missed every one of those and left the review blank on exactly
    the questions students most need explained.
    """
    for suf in ("ities", "ement", "ation", "ingly", "ness", "ious", "able", "ible",
                "ing", "ies", "ied", "ers", "est", "ely", "ity", "ive", "ous", "ful",
                "ed", "es", "ly", "er", "al", "s"):
        if w.endswith(suf) and len(w) - len(suf) >= 4:
            w = w[: -len(suf)]
            break
    return w


def words(s: str) -> list[str]:
    return [stem(w) for w in re.findall(r"[a-z0-9']+", s.lower())
            if w not in STOP and len(w) > 2]


# "Cotton socks C - made of pure cotton" — a list entry, which on a General
# Training paper is a sentence in every way that matters.
ITEM = re.compile(r"(?<=[a-z0-9.)])\s+(?=[A-Z][A-Za-z'\u2019-]*(?:\s+[A-Za-z'\u2019/&-]+){0,4}\s+[-\u2013\u2014]\s)")
LONGEST = 240


def sentences(text: str) -> list[str]:
    """Split a passage into pieces small enough to be worth highlighting.

    Half of a General Training passage is not prose at all — it is a price
    list, a table of opening hours, a column of one-line rules — and none of it
    has full stops. Splitting on those alone produced "sentences" six hundred
    characters long, so the review highlighted a third of the page and taught
    nothing. Anything still too long after every split is dropped rather than
    shown: no highlight is better than a highlight that covers everything.
    """
    out = []
    for rough in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])|\s{2,}", text):
        rough = rough.strip()
        if not rough:
            continue
        parts = [rough]
        if len(rough) > LONGEST:
            parts = [x for x in ITEM.split(rough) if x.strip()]
        for part in parts:
            if len(part) > LONGEST:
                parts2 = [x.strip() for x in re.split(r"(?<=[;:])\s+|\s+\u00b7\s+", part)]
                out.extend(x for x in parts2 if x)
            else:
                out.append(part.strip())
    return [s for s in out if s]


# --------------------------------------------------------------- the paper

def coverage(section: dict) -> dict:
    """Which question numbers each answer box stands for — see lib/coverage.ts."""
    slots = []
    for g in section["groups"]:
        for line in g.get("lines", []):
            t = line["t"] if isinstance(line, dict) else line
            slots += [int(m) for m in re.findall(r"\{\{(\d+)[a-z]?\}\}", str(t))]
        for row in g.get("table", []):
            for cell in row:
                t = cell["t"] if isinstance(cell, dict) else cell
                slots += [int(m) for m in re.findall(r"\{\{(\d+)[a-z]?\}\}", str(t))]
        for q in g.get("questions", []):
            slots.append(q["n"])
    slots = sorted(set(slots))
    qs = sorted(section["qs"])
    cover = {}
    for i, n in enumerate(slots):
        nxt = slots[i + 1] if i + 1 < len(slots) else 10 ** 9
        claimed = [q for q in qs if n <= q < nxt] or [n]
        cover[n] = claimed
    return cover


def stems(test: dict) -> dict:
    """The wording of each question, filed under every number it covers."""
    out = {}
    for si, s in enumerate(test["sections"]):
        cover = coverage(s)
        for g in s["groups"]:
            def put(n, text, extra=""):
                for c in cover.get(n, [n]):
                    out[c] = (si, plain(text), extra)

            for line in g.get("lines", []):
                t = line["t"] if isinstance(line, dict) else line
                for m in re.findall(r"\{\{(\d+)[a-z]?\}\}", str(t)):
                    put(int(m), re.sub(r"\{\{\d+[a-z]?\}\}", " ", str(t)))
            for row in g.get("table", []):
                for cell in row:
                    t = cell["t"] if isinstance(cell, dict) else cell
                    for m in re.findall(r"\{\{(\d+)[a-z]?\}\}", str(t)):
                        # a table gap gets its own row and column for context
                        head = plain(row[0]["t"] if isinstance(row[0], dict) else row[0])
                        put(int(m), f"{head} {t}")
            for q in g.get("questions", []):
                opts = q.get("opts") or g.get("opts") or []
                labels = {}
                for i, o in enumerate(opts):
                    if isinstance(o, dict):
                        labels[o["l"].lower()] = o["t"]
                for bank in (g.get("bank") or []):
                    labels[str(bank[0]).lower()] = str(bank[1])
                put(q["n"], q["stem"], json.dumps(labels))
    return out


# ------------------------------------------------------------ the three ways

def phrases_of(k: dict) -> list[str]:
    raw = list(k.get("accept") or k.get("any") or [])
    raw.append(k.get("display", ""))
    out = []
    for p in raw:
        p = re.sub(r"\([^)]*\)", " ", str(p))
        for bit in re.split(r"\s*/\s*|\s*·\s*|\s*,\s*", p):
            bit = bit.strip(" .,;:")
            if len(bit) >= 4 and not NOT_A_PHRASE.match(bit) and not JUST_A_LABEL.match(bit):
                out.append(bit)
    return sorted(set(out), key=len, reverse=True)


def find_exact(phrases: list[str], paras: list[str]) -> str | None:
    """The answer's own words, inside a single paragraph."""
    for p in phrases:
        needle = p.lower()
        for para in paras:
            i = para.lower().find(needle)
            if i != -1:
                return para[i:i + len(p)]     # give back the passage's own casing
    return None


def find_near(query: str, sents: list[str]) -> str | None:
    """The line the question is talking about, or nothing.

    Nothing is a perfectly good answer here. A wrong line is worse than a blank
    one: a student told "this is where it says so" about an unrelated sentence
    learns to distrust the whole review. So the bar is deliberately high — the
    sentence has to carry a real share of the question's own words — and a
    question that does not clear it simply gets no mark.
    """
    want = set(words(query))
    if len(want) < 3:
        return None                            # "Book B" says nothing to match on
    need = max(2, round(0.33 * len(want)))
    best, score = None, 0.0
    for s in sents:
        if len(s) > LONGEST:
            continue                           # too big to be a useful highlight
        have = set(words(s))
        hits = len(want & have)
        if hits < need:
            continue
        # how much of the question this line covers, against how much of the
        # line is padding — a long sentence has to earn its extra words
        v = (hits / len(want)) * (hits / (hits + 0.35 * len(have - want)))
        if v > score:
            best, score = s, v
    return best if score >= 0.22 else None


# -------------------------------------------------------------------- main

def main() -> int:
    root = pathlib.Path(sys.argv[1])
    ev_dir = root / "content" / "evidence"
    ev_dir.mkdir(exist_ok=True)

    catalogue = json.loads((root / "content" / "catalogue.json").read_text("utf8"))
    rows = []

    for entry in sorted(catalogue, key=lambda c: (c["set"], c["order"])):
        tid = entry["id"]
        if entry["mode"] != "reading":
            continue                          # a listening answer is in the audio
        if (ev_dir / f"{tid}.json").exists():
            continue                          # already marked, by hand or earlier
        key_path = root / "content" / "keys" / f"{tid}.json"
        if not key_path.exists():
            rows.append((tid, "no answer key yet", 0, 0, 0, 40))
            continue

        test = json.loads((root / "content" / "tests" / f"{tid}.json").read_text("utf8"))
        key = json.loads(key_path.read_text("utf8"))
        where = stems(test)

        # Paragraph by paragraph, never the passage as one run of text. The
        # player marks a paragraph at a time, so a sentence that happens to
        # straddle two of them can never be found again and its pin does
        # nothing — a button that silently fails is worse than no button.
        texts, sents, para_labels = [], [], []
        for s in test["sections"]:
            paras = (s.get("passage") or {}).get("paras", [])
            para_labels.append({
                str(p["l"]).upper() for p in paras if isinstance(p, dict) and p.get("l")
            })
            bits = [plain(p if isinstance(p, str) else p["t"]) for p in paras]
            texts.append([b for b in bits if b])
            sents.append([x for b in bits for x in sentences(b)])

        out, n_exact, n_near, n_none = {}, 0, 0, 0
        for n_str, k in key.items():
            n = int(n_str)
            si, stem, extra = where.get(n, (0, "", ""))
            if si >= len(texts) or not texts[si]:
                continue

            display = str(k.get("display", ""))
            if re.search(r"\bNOT\s*GIVEN\b", display, re.I):
                out[n_str] = {"s": si, "t": [], "k": "none"}
                n_none += 1
                continue

            # "Which paragraph mentions…" and "choose a heading for paragraph B"
            # are answered by a whole paragraph, not a sentence. The review
            # already tints the paragraph, and the question's own wording is a
            # bare heading with nothing distinctive in it, so hunting for a
            # sentence here only ever found the wrong one.
            answer = (k.get("accept") or k.get("any") or [""])[0]
            if re.fullmatch(r"[A-Za-z]|[ivxlcIVXLC]{1,5}", str(answer)) and (
                    str(answer).upper() in para_labels[si] or len(words(stem)) < 4):
                continue

            hit = find_exact(phrases_of(k), texts[si])
            if hit:
                out[n_str] = {"s": si, "t": [hit], "k": "exact"}
                n_exact += 1
                continue

            # no phrase to look up: go by what the question is talking about,
            # plus the wording of the option that turned out to be right
            query = stem
            try:
                labels = json.loads(extra) if extra else {}
            except json.JSONDecodeError:
                labels = {}
            for want in (k.get("accept") or k.get("any") or []):
                text = labels.get(str(want).lower())
                if text:
                    query += " " + text
            near = find_near(query, sents[si])
            if near:
                out[n_str] = {"s": si, "t": [near], "k": "near"}
                n_near += 1

        if out:
            (ev_dir / f"{tid}.json").write_text(
                json.dumps(out, ensure_ascii=False, indent=1), encoding="utf8")
        rows.append((tid, "", n_exact, n_near, n_none, 40 - len(out)))

    print(f"{'test':<8}{'exact':>7}{'closest':>9}{'not given':>11}{'no line':>9}   note")
    tot = [0, 0, 0, 0]
    for tid, note, a, b, c, d in rows:
        print(f"{tid:<8}{a:>7}{b:>9}{c:>11}{d:>9}   {note}")
        tot = [tot[0] + a, tot[1] + b, tot[2] + c, tot[3] + d]
    print(f"{'TOTAL':<8}{tot[0]:>7}{tot[1]:>9}{tot[2]:>11}{tot[3]:>9}")
    marked = tot[0] + tot[1] + tot[2]
    print(f"\n{marked} of {marked + tot[3]} questions now have something to show.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
