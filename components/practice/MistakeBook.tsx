"use client";

/* Every question this student has got wrong, in one place, filtered by test or
 * by question type.
 *
 * The per-type chart says *which* skill is costing marks. This says exactly
 * which questions — so "I keep losing Matching Headings" becomes eleven real
 * questions the student can sit down and work through, each with the answer
 * and, on request, the reasoning.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { Explain } from "./Review";

export type Miss = {
  attemptId: string;
  testId: string;
  testName: string;
  when: string;
  n: string;
  type: string;
  given: string;
  expected: string;
  /** what the letters actually said, when the question had options */
  expectedText?: string;
  givenText?: string;
};

const SELECT: React.CSSProperties = {
  padding: "9px 11px", borderRadius: 10, border: "1.5px solid var(--grey-light)",
  fontFamily: "inherit", fontSize: "0.86rem", background: "var(--paper)",
  color: "var(--navy)", minHeight: 42, maxWidth: "100%",
};

export default function MistakeBook({ misses }: { misses: Miss[] }) {
  const [test, setTest] = useState("all");
  const [type, setType] = useState("all");
  const [limit, setLimit] = useState(25);

  const tests = useMemo(() => {
    const m = new Map<string, string>();
    for (const x of misses) if (!m.has(x.testId)) m.set(x.testId, x.testName);
    return [...m.entries()];
  }, [misses]);

  const types = useMemo(() => {
    const c = new Map<string, number>();
    for (const x of misses) c.set(x.type, (c.get(x.type) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  }, [misses]);

  const shown = useMemo(
    () => misses.filter((x) => (test === "all" || x.testId === test) && (type === "all" || x.type === type)),
    [misses, test, type],
  );

  if (!misses.length) {
    return (
      <div className="pr-note">
        Nothing to correct yet — you have not got a question wrong on a marked test.
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <select style={SELECT} value={test} onChange={(e) => { setTest(e.target.value); setLimit(25); }}
          aria-label="Filter by test">
          <option value="all">All tests</option>
          {tests.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>

        <select style={SELECT} value={type} onChange={(e) => { setType(e.target.value); setLimit(25); }}
          aria-label="Filter by question type">
          <option value="all">All question types</option>
          {types.map(([t, n]) => <option key={t} value={t}>{t} ({n})</option>)}
        </select>

        <span style={{ color: "var(--grey)", fontSize: "0.86rem" }}>
          {shown.length} to work through
        </span>
      </div>

      {!shown.length && (
        <div className="pr-note">No mistakes of that kind — that one you have got right every time.</div>
      )}

      {shown.slice(0, limit).map((x, i) => (
        <div key={`${x.attemptId}-${x.n}-${i}`}
          style={{ border: "1px solid var(--grey-light)", borderLeft: "4px solid #C2452F",
            borderRadius: 11, padding: "12px 14px", marginBottom: 10, background: "var(--paper)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, color: "var(--coral-dark)", fontSize: "0.8rem",
              background: "var(--coral-light)", borderRadius: 11, padding: "3px 9px" }}>
              Q{x.n}
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--grey)", background: "var(--gold-light)",
              borderRadius: 8, padding: "3px 8px" }}>
              {x.type}
            </span>
            <span style={{ flex: 1, minWidth: 160, fontSize: "0.84rem", color: "var(--grey)" }}>
              {x.testName} · {new Date(x.when).toLocaleDateString()}
            </span>
            <Link href={`/practice/results/${x.attemptId}`}
              style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--coral-dark)" }}>
              open the paper →
            </Link>
          </div>

          {/* A letter on its own teaches nothing, so the wording goes with it. */}
          <div style={{ display: "grid", gap: 4, margin: "9px 0 0 4px", fontSize: "0.86rem" }}>
            <div style={{ padding: x.givenText ? "6px 9px" : 0, borderRadius: 8,
              background: x.givenText ? "#FBE9E7" : undefined }}>
              You wrote: <b style={{ color: "#A3251A" }}>{x.given}</b>
              {x.givenText && <span style={{ color: "#8E2016" }}> — {x.givenText}</span>}
            </div>
            <div style={{ padding: x.expectedText ? "6px 9px" : 0, borderRadius: 8,
              background: x.expectedText ? "#E8F5EE" : undefined, color: "var(--grey)" }}>
              Correct answer: <b style={{ color: x.expectedText ? "#0B5D3B" : "var(--navy)" }}>{x.expected}</b>
              {x.expectedText && <span style={{ color: "#0B5D3B" }}> — {x.expectedText}</span>}
            </div>
          </div>

          <Explain testId={x.testId} n={Number(x.n)} />
        </div>
      ))}

      {shown.length > limit && (
        <button className="btn btn-outline" type="button" onClick={() => setLimit((l) => l + 25)}>
          Show 25 more
        </button>
      )}
    </>
  );
}
