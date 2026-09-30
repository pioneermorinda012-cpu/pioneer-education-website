"""Turn one of the hand-authored Pioneer Listening HTML papers into the site's format.

The listening papers are built like the GT Reading ones — instruction blocks,
<div class="q"> questions, an ANSWER_KEY at the bottom — with three differences:

  * the "passage" is the transcript, and the line that answers each question is
    marked in it by hand, exactly as in the reading papers. That becomes the
    "🎧 In the recording" evidence shown after marking;
  * the recording is embedded as four base64 MP3s, one per section. The site
    plays one file with a start time per section, so they are joined here;
  * pictures sit inside questions (choose the picture A–D), not just in passages.

    python scripts/import-listening-html.py <repo-root> <paper.html> <test-id> "<label>"

Out:  content/tests/<id>.json      the paper, no answers, no evidence
      content/keys/<id>.json       the answer key               (server only)
      content/evidence/<id>.json   what is said for each answer (server only)
      public/practice/media/<id>/  pictures + audio_main.mp3 (the mp3 is not committed)
      supabase-upload/<id>-<md5>.mp3  the same recording, named for the bucket
"""
import base64
import hashlib
import importlib
import json
import pathlib
import re
import subprocess
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).parent))
conv = importlib.import_module("import-html-test")

IMG = re.compile(r'<img\b[^>]*src="(data:image/[^"]+)"[^>]*>')


def attach_question_images(q_html: str, media: dict, tid: str, out_dir: pathlib.Path):
    """Pictures inside a question belong to that question; the rest are hoisted
    to the top level so the group they sit in shows them."""
    per_q: dict[int, str] = {}

    # Bullet lists and small headings inside a set of notes: the reading
    # converter only walks block elements, so a <ul> of gaps silently vanished
    # (two questions lost in Book 1 Test 1). Flatten them to one line each.
    out = re.sub(r"</?ul[^>]*>", "", q_html)
    out = re.sub(r"<li[^>]*>", "<p>", out).replace("</li>", "</p>")
    out = re.sub(r"<h4[^>]*>(.*?)</h4>", r"<p><b>\1</b></p>", out, flags=re.S)

    # Wording with no gap of its own ("Meal C:", "cost: $50/head", a form
    # title) is what tells the student which gap is which. The reading
    # converter keeps only lines that hold a gap, so tag these with a {{0}}
    # sentinel it will keep, and strip the sentinel again afterwards.
    def keep(m):
        inner = m.group(2)
        if "<input" in inner or "<select" in inner or not conv.plain(inner):
            return m.group(0)
        return f"<p{m.group(1)}>{inner} {{{{0}}}}</p>"
    out = re.sub(r"<p([^>]*)>(.*?)</p>", keep, out, flags=re.S)

    # questions first (walk from the end so indices stay valid)
    for m in list(re.finditer(r'<div class="q" id="qw(\d+)">', out))[::-1]:
        inner, after = conv.balanced(out, m.start(), "div")
        im = IMG.search(inner)
        if im:
            per_q[int(m.group(1))] = conv.save_data_uri(im.group(1), media, tid, out_dir)
            body = IMG.sub("", inner, count=1)
            out = out[:m.start()] + m.group(0) + body + "</div>" + out[after:]

    # any picture still nested inside a notes block moves up beside it
    rebuilt = []
    for tag, attrs, body in conv.top_level(out):
        if tag == "img":
            rebuilt.append(f"<img{attrs}>")
            continue
        imgs = IMG.findall(body) if tag != "img" else []
        for src in imgs:
            rebuilt.append(f'<img class="mapimg" src="{src}">')
        body = IMG.sub("", body)
        rebuilt.append(f"<{tag}{attrs}>{body}</{tag}>")
    return "\n".join(rebuilt), per_q


def tidy_line(line: str) -> str:
    """One gap, drawn once, with its words spaced and no sentinel left behind."""
    line = re.sub(r'<input[^>]*data-q="(\d+)"[^>]*>', r"{{\1}}", line)
    for n in set(re.findall(r"\{\{(\d+)\}\}", line)):
        first = line.index("{{%s}}" % n) + len("{{%s}}" % n)
        line = line[:first] + line[first:].replace("{{%s}}" % n, "")
    line = re.sub(r"\s*\{\{0\}\}", "", line)
    line = re.sub(r"(\}\})(?=[A-Za-z0-9(])", r"\1 ", line)
    return re.sub(r"\s+", " ", line).strip()


def table_choices(g: dict) -> None:
    """A dropdown inside a table cell becomes an ordinary choice question.

    The site's tables draw typed gaps only, so the cell keeps the question's
    number where the student can see it, and the question itself is asked
    underneath, named by its row and column ("Monday – Afternoon")."""
    rows = g.get("table") or []
    if not any("[[sel:" in json.dumps(r) for r in rows):
        return
    head = [c["t"] if isinstance(c, dict) else c for c in rows[0]] if rows else []
    qs = []
    for r in rows:
        for ci, cell in enumerate(r):
            t = cell["t"] if isinstance(cell, dict) else cell
            m = re.search(r"\[\[sel:(\d+)\]\]", t)
            if not m:
                continue
            n = int(m.group(1))
            new = t.replace(m.group(0), f"<b>({n})</b>")
            if isinstance(cell, dict):
                cell["t"] = new
            else:
                r[ci] = new
            row_name = conv.plain(r[0]["t"] if isinstance(r[0], dict) else r[0])
            col_name = conv.plain(head[ci]) if ci < len(head) else ""
            stem = " – ".join(x for x in (row_name, col_name) if x)
            opts = [dict(o) if isinstance(o, dict) else o for o in conv.SEL_OPTS.get(n, [])]
            qs.append({"n": n, "stem": stem, "opts": opts})
    g["questions"] = sorted(qs, key=lambda q: q["n"]) + g.get("questions", [])
    g.pop("bank", None)


def merge_anyof(groups: list, answer_key: dict) -> None:
    """Three dropdowns that share one "choose THREE" answer become one tick-box task."""
    for key in answer_key.values():
        if key.get("type") != "anyof":
            continue
        run = key["group"]
        lead = run[0]
        for g in groups:
            qs = g.get("questions", [])
            ns = [q["n"] for q in qs]
            if lead not in ns:
                continue
            first = qs[ns.index(lead)]
            opts = first["opts"]
            span = f"{run[0]}–{run[-1]}" if len(run) > 2 else f"{run[0]} and {run[-1]}"
            words = {2: "TWO", 3: "THREE", 4: "FOUR"}.get(len(run), str(len(run)))
            merged = {"n": lead, "multi": True, "opts": opts,
                      "stem": f"Choose <b>{words}</b> letters. <i>(tick {len(run)} boxes — "
                              f"this covers questions {span})</i>"}
            g["questions"] = [q for q in qs if q["n"] not in run[1:]]
            g["questions"][g["questions"].index(first)] = merged
            # the printed list is now the tick-boxes themselves
            g.pop("bank", None)
        # done with this run
        for n in run:
            answer_key[str(n)]["_merged"] = True


def build_key(answer_key: dict) -> dict:
    out = {}
    plain = {n: a for n, a in answer_key.items() if a.get("type") != "anyof"}
    out.update(conv.build_key(plain))
    for n, a in answer_key.items():
        if a.get("type") != "anyof":
            continue
        run = a["group"]
        want = [str(x) for x in a["correct"]]
        out[n] = {"any": want, "pick": len(want), "lead": run[0], "idx": run.index(int(n)),
                  "display": f"{', '.join(want)}  (Q{run[0]}–{run[-1]}, any order)"}
    # sort numerically
    return {k: out[k] for k in sorted(out, key=int)}


def join_audio(uris: list[str], out_mp3: pathlib.Path) -> list[float]:
    """Decode the four section recordings, join them, and return where each starts."""
    starts, t = [], 0.0
    with tempfile.TemporaryDirectory() as d:
        parts = []
        for i, u in enumerate(uris):
            p = pathlib.Path(d) / f"s{i}.mp3"
            p.write_bytes(base64.b64decode(u.split(",", 1)[1]))
            parts.append(p)
            dur = float(subprocess.check_output(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", str(p)]).strip())
            starts.append(round(t, 1))
            t += dur
        lst = pathlib.Path(d) / "list.txt"
        lst.write_text("".join(f"file '{p}'\n" for p in parts))
        out_mp3.parent.mkdir(parents=True, exist_ok=True)
        subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                               "-i", str(lst), "-ac", "1", "-ar", "32000", "-b:a", "40k", str(out_mp3)])
    total = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(out_mp3)]).strip())
    if abs(total - t) > 3:
        raise SystemExit(f"joined recording is {total:.0f}s but the parts add up to {t:.0f}s")
    return starts, total


BANDS = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5],
         [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 2]]


def convert(root: pathlib.Path, src: pathlib.Path, tid: str, label: str):
    html = src.read_text(encoding="utf8")

    m = re.search(r"const ANSWER_KEY\s*=\s*", html)
    body, _ = conv.balanced_braces(html, html.index("{", m.end()))
    answer_key = json.loads(body)
    part_qs = json.loads(re.search(r"const PART_QS\s*=\s*(\[.*?\]);", html, re.S).group(1))
    audio = re.findall(r'"(data:audio/[^"]+)"', re.search(r"const AUDIO\s*=\s*\[(.*?)\];", html, re.S).group(1))
    total_q = len(answer_key)

    media_dir = root / "public" / "practice" / "media" / tid
    media_dir.mkdir(parents=True, exist_ok=True)
    media: dict = {}
    evidence: dict = {}
    sections = []
    q_imgs: dict[int, str] = {}

    for si, part in enumerate(re.finditer(r'<section class="part" id="part\d+">', html)):
        inner, _ = conv.balanced(html, part.start(), "section")
        lo, hi = part_qs[si]

        tm = re.search(r'<div class="passage transcript"[^>]*>', inner)
        tr_html, _ = conv.balanced(inner, tm.start(), "div")
        conv.lift_evidence(tr_html, evidence, si)

        qm = re.search(r'<div class="questions">', inner)
        q_html, _ = conv.balanced(inner, qm.start(), "div")
        q_html, per_q = attach_question_images(q_html, media, tid, media_dir)
        q_imgs.update(per_q)
        groups = conv.read_questions(q_html, media, tid, media_dir)
        sections.append({"label": f"Section {si + 1}", "qs": list(range(lo, hi + 1)), "groups": groups})

    for s in sections:
        for g in s["groups"]:
            for q in g.get("questions", []):
                if q["n"] in q_imgs:
                    q["img"] = q_imgs[q["n"]]
                # "A – Europe" as the text of option A would print the letter twice
                for o in q.get("opts", []):
                    if isinstance(o, dict):
                        o["t"] = re.sub(rf"^{re.escape(o['l'])}\s*[–-]\s*", "", o["t"])
            # a gap written inside the question wording keeps its own <input>
            g["lines"] = [tidy_line(l) if isinstance(l, str) else l for l in g.get("lines", [])]
            if not g["lines"]:
                g.pop("lines")
            table_choices(g)
            for q in g.get("questions", []):
                for o in q.get("opts", []):
                    if isinstance(o, dict):
                        o["t"] = re.sub(rf"^{re.escape(o['l'])}\s*[–-]\s*", "", o["t"])
        merge_anyof(s["groups"], answer_key)

    for v in evidence.values():
        v["t"] = [x for x in v["t"] if x]
        v["k"] = "exact"

    # --- the recording
    mp3 = media_dir / "audio_main.mp3"
    starts, secs = join_audio(audio, mp3)
    md5 = hashlib.md5(mp3.read_bytes()).hexdigest()[:8]
    up = root / "supabase-upload" / f"{tid}-{md5}.mp3"
    up.parent.mkdir(exist_ok=True)
    up.write_bytes(mp3.read_bytes())
    media["audio_main"] = f"/practice/media/{tid}/audio_main.mp3"

    mins = round(secs / 60)
    test = {
        "id": tid,
        "mode": "listening",
        "name": f"{tid.upper()} — {label}",
        "blurb": f"4 sections · {total_q} questions · one {mins}-minute recording",
        "minutes": 40,
        "total": total_q,
        "audioId": "audio_main",
        "sectionStarts": starts,
        "bandsListening": BANDS,
        "bandsReading": BANDS,
        "rules": [
            f"Tap <b>Load the recording</b>, then press play. The recording runs about {mins} minutes and covers all four sections.",
            "Use the <b>Sec 1–4</b> buttons to jump straight to a section if you are practising one part only.",
            "Read the instructions above each group of questions carefully — the word limit changes.",
            f"Answer all {total_q} questions, then tap <b>Submit Test</b> for your band score.",
            "A 40-minute timer runs in the background; the test submits itself at zero.",
            "Your answers save automatically on this device if the page reloads.",
        ],
        "sections": sections,
        "mediaUrls": media,
        "audioFile": up.name,
    }
    (root / "content" / "tests" / f"{tid}.json").write_text(json.dumps(test, ensure_ascii=False), encoding="utf8")
    (root / "content" / "keys" / f"{tid}.json").write_text(
        json.dumps(build_key(answer_key), ensure_ascii=False, indent=1), encoding="utf8")
    (root / "content" / "evidence" / f"{tid}.json").write_text(
        json.dumps({k: evidence[k] for k in sorted(evidence, key=int)}, ensure_ascii=False, indent=1),
        encoding="utf8")
    return test, answer_key, evidence, secs


if __name__ == "__main__":
    root, src, tid, label = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3], sys.argv[4]
    test, key, ev, secs = convert(root, src, tid, label)
    print(f"{tid}: {secs/60:.1f} min, starts {test['sectionStarts']}, {len(key)} keys, "
          f"{len(ev)} evidence, media {sorted(test['mediaUrls'])}")
