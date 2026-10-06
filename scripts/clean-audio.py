"""Take the background hiss and rumble out of the noisy listening recordings.

    python scripts/clean-audio.py [test-id ...]

Filter (chosen by the owner from three samples, 5 Oct 2026): a high-pass at
80 Hz for the rumble, then FFT noise reduction (afftdn nf=-30 nr=15, noise
tracking on) for the hiss. Gentle on purpose: stronger settings made voices
sound "underwater". The result ships with the site in public/practice/audio
(see PRACTICE_SETUP.md), named by its checksum, and the paper is pointed at it.
Timings are unchanged, so section starts and transcripts still line up.
"""
import hashlib
import json
import pathlib
import shutil
import subprocess
import sys

NOISY = ["v3l4", "v4l5", "v4l6", "v1l3", "v1l6", "v2l1", "v2l2", "v3l1", "v3l2", "v4l1", "v4l2", "v5l1", "v7l1", "v7l2", "v8l1", "v8l2",
         "p2l1", "p2l3", "p2l4", "p2l5", "mtl1", "mtl5", "mtl6", "mtl7"]
FILTER = "highpass=f=80,afftdn=nf=-30:nr=15:tn=1"
# best source for these: the owner's original high-bitrate files
# (Mock Tests 5-7 were first cleaned from the owner's 128 kbps mp3s; since 5 Oct 2026
# they come from his HTML papers, whose transcript timings match their own audio.)
ORIGINAL = {}

root = pathlib.Path(__file__).resolve().parent.parent
out_dir = root / "public" / "practice" / "audio"
out_dir.mkdir(parents=True, exist_ok=True)


def duration(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", str(p)]).strip())


for tid in sys.argv[1:] or NOISY:
    tp = root / "content" / "tests" / f"{tid}.json"
    t = json.loads(tp.read_text("utf8"))
    if t.get("audioCleaned"):
        print(tid, "already cleaned"); continue
    url = t["mediaUrls"][t.get("audioId", "audio_main")]
    src = root / ORIGINAL[tid] if tid in ORIGINAL else (
        root / "public" / url.lstrip("/") if url.startswith("/practice/audio/")
        else root / "public" / "practice" / "media" / tid / "audio_main.mp3")
    tmp = out_dir / f"{tid}.tmp.mp3"
    subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-af", FILTER,
                           "-ac", "1", "-ar", "32000", "-b:a", "40k", str(tmp)])
    if abs(duration(tmp) - duration(src)) > 1:
        raise SystemExit(f"{tid}: length changed")
    md5 = hashlib.md5(tmp.read_bytes()).hexdigest()[:8]
    final = out_dir / f"{tid}-{md5}.mp3"
    tmp.replace(final)
    old = url.startswith("/practice/audio/") and root / "public" / url.lstrip("/")
    t["audioFile"] = final.name
    t["mediaUrls"][t.get("audioId", "audio_main")] = f"/practice/audio/{final.name}"
    t["audioCleaned"] = FILTER
    tp.write_text(json.dumps(t, ensure_ascii=False), "utf8")
    if old and old.exists() and old != final:
        (root / "_to_delete").mkdir(exist_ok=True)
        shutil.move(str(old), str(root / "_to_delete" / old.name))
    print(tid, "->", final.name, f"{final.stat().st_size // 1024} KB", flush=True)
