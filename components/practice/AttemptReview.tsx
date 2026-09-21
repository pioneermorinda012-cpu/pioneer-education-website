"use client";

/* An attempt reopened later: the same review a student saw the moment they
 * finished, available in class a week afterwards. */

import Link from "next/link";
import ReviewPanel, { Leaderboard, type MarkedQuestion } from "./Review";
import { Passage, type Test } from "./Player";

export default function AttemptReview({
  test, questions, raw, total, band, who, when, back,
}: {
  test: Test;
  questions: MarkedQuestion[];
  raw: number; total: number; band: number;
  who: string; when: string; back: string;
}) {
  const track = test.catalogue.skillLabel.startsWith("General") ? "gt" : "ac";
  return (
    <div className="wrap" data-track={track} style={{ maxWidth: 900, paddingBottom: 60 }}>
      <div className="pr-head">
        <h1>{test.catalogue.skillLabel} — {test.catalogue.label}</h1>
        <span className="meta">
          {who} · {new Date(when).toLocaleString()} · {raw}/{total} correct · band {band.toFixed(1)}
        </span>
      </div>

      <div style={{ margin: "14px 0" }}>
        <Link className="btn btn-outline" href={back}>← Back</Link>
      </div>

      <Leaderboard testId={test.id} band={band} />
      <ReviewPanel test={test} questions={questions} Passage={Passage} />
    </div>
  );
}
