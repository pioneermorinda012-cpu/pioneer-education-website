"""Pull the timed transcript out of a Pioneer Listening HTML paper.

Each section of the paper carries its transcript as lines like
    <p class="tl" data-t="74.5"><span class="ts">1:14</span> … <mark class="ev" data-q="7">…</mark> …</p>
where data-t is seconds into that section's own recording. The site plays one
joined file, so each time is shifted by the section's start.

Out: content/transcripts/<id>.json — server only, sent to a student with the
marked result and never before, because it contains every answer.

    {"sections": [{"lines": [{"at": 12.3, "p": ["plain text", {"q": "7", "t": "answer words"}, "…"]}]}]}
"""
import html as H
import json
import pathlib
import re
import sys

TAG = re.compile(r"<[^>]+>")


def plain(s: str) -> str:
    return re.sub(r"\s+", " ", H.unescape(TAG.sub("", s))).replace(" ", " ")


def extract(src: pathlib.Path, starts: list[float]) -> dict:
    page = src.read_text(encoding="utf8")
    page = re.sub(r'data:[^"]+', "", page)
    out = []
    parts = list(re.finditer(r'<div class="passage transcript"[^>]*>', page))
    for si, m in enumerate(parts):
        end = parts[si + 1].start() if si + 1 < len(parts) else len(page)
        chunk = page[m.end():end]
        lines = []
        for lm in re.finditer(r'<p class="tl" data-t="([\d.]+)">(.*?)</p>', chunk, re.S):
            at = round(float(lm.group(1)) + (starts[si] if si < len(starts) else 0), 1)
            body = re.sub(r'<span class="ts">[^<]*</span>', "", lm.group(2))
            body = re.sub(r'<sup class="qb">[^<]*</sup>', "", body)
            segs, pos = [], 0
            for mm in re.finditer(r'<mark class="ev" data-q="(\d+)">(.*?)</mark>', body, re.S):
                before = plain(body[pos:mm.start()])
                if before.strip():
                    segs.append(before)
                segs.append({"q": mm.group(1), "t": plain(mm.group(2)).strip()})
                pos = mm.end()
            tail = plain(body[pos:])
            if tail.strip():
                segs.append(tail)
            if segs:
                if isinstance(segs[0], str):
                    segs[0] = segs[0].lstrip()
                lines.append({"at": at, "p": segs})
        out.append({"lines": lines})
    return {"sections": out}


if __name__ == "__main__":
    root, src, tid = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3]
    test = json.loads((root / "content" / "tests" / f"{tid}.json").read_text("utf8"))
    data = extract(src, test.get("sectionStarts") or [])
    d = root / "content" / "transcripts"
    d.mkdir(parents=True, exist_ok=True)
    (d / f"{tid}.json").write_text(json.dumps(data, ensure_ascii=False), "utf8")
    qs = sorted({int(s["q"]) for sec in data["sections"] for l in sec["lines"] for s in l["p"] if isinstance(s, dict)})
    print(f"{tid}: {sum(len(s['lines']) for s in data['sections'])} lines, answers marked for {len(qs)} questions")
