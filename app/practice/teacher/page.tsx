"use client";

import { useCallback, useEffect, useState } from "react";
import { byType } from "@/lib/qtypes";
import SkillCards from "@/components/practice/SkillCards";
import { summarise } from "@/lib/skill-summary";

type Student = {
  id: string; code: string; full_name: string;
  batch: string | null; track: string; active: boolean; created_at: string;
  email?: string | null; phone?: string | null;
};
type Att = {
  id: string; student_id: string; test_id: string; skill: string;
  raw_score: number; total: number; band: number; submitted_at: string;
  per_question?: { n: string; correct: boolean; given: string; expected: string; type?: string }[];
};
/* the modules a login can open — the same keys as lib/access.ts */
const AREAS = [
  { key: "academic", label: "IELTS Academic" },
  { key: "gt", label: "IELTS GT" },
  { key: "english", label: "English" },
  { key: "pte", label: "PTE" },
  { key: "german", label: "German" },
] as const;
const areaLabel = (k: string) => AREAS.find((a) => a.key === k)?.label ?? k;
/* Students by course, for the filter above both student lists. A student on
   two courses counts under both; "No modules set" is a login that opens
   everything (made before modules existed). */
const GROUPS = [
  { key: "ielts", label: "IELTS", areas: ["academic", "gt"] },
  { key: "pte", label: "PTE", areas: ["pte"] },
  { key: "english", label: "English", areas: ["english"] },
  { key: "german", label: "German", areas: ["german"] },
] as const;
type Group = "all" | "none" | (typeof GROUPS)[number]["key"];

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

const SKILL_NAME: Record<string, string> = {
  AL: "Academic Listening", AR: "Academic Reading", GL: "GT Listening", GR: "GT Reading",
};

export default function TeacherPage() {
  const [state, setState] = useState<"loading" | "setup" | "locked" | "in">("loading");
  const [missing, setMissing] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attempts, setAttempts] = useState<Att[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [access, setAccessMap] = useState<Record<string, string[]>>({});
  type WBand = {
    student_id: string; kind: string; status: string; submitted_at: string;
    teacher_band: number | null; auto_band: number | null;
  };
  const [wbands, setWbands] = useState<WBand[]>([]);
  type Check = { missing: string[]; mail: boolean; mailFrom: string; owner: string; site: string; keyMode: string };
  const [check, setCheck] = useState<Check | null>(null);
  const [mailTo, setMailTo] = useState("");
  const [mailResult, setMailResult] = useState("");
  const [group, setGroup] = useState<Group>("all");
  const [q, setQ] = useState("");
  const [until, setUntilMap] = useState<Record<string, Record<string, string>>>({});
  const [editing, setEditing] = useState<{ id: string; areas: string[]; clear: string[] } | null>(null);
  const [tab, setTab] = useState<"results" | "writing" | "people">("results");
  type Wr = {
    id: string; student_id: string; kind: string; question: string; words: number;
    status: string; auto_band: number | null; teacher_band: number | null; submitted_at: string;
    students?: { full_name?: string; code?: string; batch?: string | null } | null;
  };
  const [writings, setWritings] = useState<Wr[] | null>(null);
  const [wFilter, setWFilter] = useState<"todo" | "all">("todo");
  const [open, setOpen] = useState<{ student: Student | null; attempts: Att[]; writings: Wr[] } | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [teacherCode, setTeacherCode] = useState("");
  const [form, setForm] = useState({ code: "", full_name: "", batch: "", pin: "", access: ["academic"] as string[] });
  const [justMade, setJustMade] = useState<{ code: string; pin: string; name: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/practice/teacher", { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    if (!d.configured) { setMissing(d.missing ?? []); setState("setup"); return; }
    if (!d.authed) { setState("locked"); return; }
    setStudents(d.students ?? []);
    setAttempts(d.attempts ?? []);
    setNames(d.names ?? {});
    setAccessMap(d.access ?? {});
    setUntilMap(d.until ?? {});
    setWbands(d.wbands ?? []);
    if (d.error) setErr(d.error);
    setState("in");
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadWritings = useCallback(async () => {
    const res = await fetch("/api/practice/teacher?writings=1", { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    setWritings(d.writings ?? []);
    if (d.error) setErr(d.error);
  }, []);
  useEffect(() => { if (tab === "writing" && state === "in") loadWritings(); }, [tab, state, loadWritings]);

  async function post(payload: Record<string, unknown>) {
    setErr(""); setBusy(true);
    const res = await fetch("/api/practice/teacher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(d.error || "Something went wrong."); return null; }
    return d;
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (await post({ action: "login", teacherCode })) { setTeacherCode(""); load(); }
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    const made = { code: form.code.toUpperCase(), pin: form.pin, name: form.full_name };
    const d = await post({ action: "create", ...form });
    if (d) {
      setJustMade(made);
      if (d.warning) setErr(d.warning);
      setForm({ code: "", full_name: "", batch: form.batch, pin: "", access: form.access });
      load();
    }
  }

  async function runCheck() {
    setMailResult("");
    const res = await fetch("/api/practice/teacher?check=1", { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    setCheck(d);
    if (!mailTo && d.owner) setMailTo(d.owner);
  }

  async function testMail() {
    setMailResult("Sending…");
    const d = await post({ action: "testMail", to: mailTo });
    if (!d) { setMailResult(""); return; }
    setMailResult(d.ok ? `Sent to ${d.to} — check that inbox (and spam).` : `Failed: ${d.error}`);
  }

  const flip = (list: string[], k: string) =>
    list.includes(k) ? list.filter((x) => x !== k) : [...list, k];

  async function saveAccess() {
    if (!editing) return;
    if (await post({ action: "access", id: editing.id, access: editing.areas, clear: editing.clear })) {
      setEditing(null);
      load();
    }
  }

  async function openStudent(s: Student) {
    setErr("");
    const res = await fetch(`/api/practice/teacher?student=${encodeURIComponent(s.id)}`, { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    setOpen({ student: d.student ?? s, attempts: d.attempts ?? [], writings: d.writings ?? [] });
  }

  async function toggle(s: Student) {
    if (await post({ action: "active", id: s.id, active: !s.active })) load();
  }

  async function resetPin(s: Student) {
    const pin = window.prompt(`New PIN for ${s.full_name} (4–8 digits)`);
    if (!pin) return;
    if (await post({ action: "resetPin", id: s.id, pin })) {
      setJustMade({ code: s.code, pin, name: s.full_name });
      load();
    }
  }

  if (state === "loading") return <div className="wrap"><p className="lede">Loading…</p></div>;

  if (state === "setup") {
    return (
      <div className="wrap pr-signin">
        <h1>Teacher area</h1>
        <div className="pr-err">
          Not configured yet. Add {missing.join(", ")} to the environment variables in Vercel,
          then redeploy.
        </div>
      </div>
    );
  }

  if (state === "locked") {
    return (
      <div className="wrap pr-signin">
        <h1>Teacher area</h1>
        <p className="lede">Create and manage student accounts.</p>
        <form onSubmit={signIn}>
          <label htmlFor="tc">Teacher code</label>
          <input id="tc" type="password" value={teacherCode} autoFocus
                 onChange={(e) => setTeacherCode(e.target.value)} />
          {err && <div className="pr-err">{err}</div>}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  const live = students.filter((s) => s.active).length;

  /* ---- course filter and search, shared by both student lists ---- */
  const areasOf = (g: Group) => GROUPS.find((x) => x.key === g)?.areas as readonly string[] | undefined;
  const inGroup = (id: string, g: Group) =>
    g === "all" ? true : g === "none" ? !access[id] : (access[id] ?? []).some((a) => areasOf(g)!.includes(a));
  // on the course, but every one of its modules has passed its end date
  const endedIn = (id: string, g: Group) => {
    const want = areasOf(g);
    if (!want) return false;
    const mine = (access[id] ?? []).filter((a) => want.includes(a));
    return mine.length > 0 && mine.every((a) => until[id]?.[a] && Date.parse(until[id][a]) <= Date.now());
  };
  const needle = q.trim().toLowerCase();
  const matches = (st: Student) =>
    inGroup(st.id, group) &&
    (!needle || [st.full_name, st.code, st.email ?? "", st.phone ?? "", st.batch ?? ""]
      .some((v) => v.toLowerCase().includes(needle)));
  const counts = [
    { key: "all" as Group, label: "All", n: students.length, ended: 0 },
    ...GROUPS.map((g) => ({
      key: g.key as Group, label: g.label,
      n: students.filter((s) => inGroup(s.id, g.key)).length,
      ended: students.filter((s) => endedIn(s.id, g.key)).length,
    })),
    { key: "none" as Group, label: "No modules set", n: students.filter((s) => !access[s.id]).length, ended: 0 },
  ];
  const filterBar = (
    <div className="pr-filter">
      <div className="pr-chips" role="tablist" aria-label="Course">
        {counts.filter((c) => c.key === "all" || c.n > 0).map((c) => (
          <button key={c.key} type="button" role="tab" aria-selected={group === c.key}
                  className={group === c.key ? "on" : undefined} onClick={() => setGroup(c.key)}
                  title={c.ended ? `${c.ended} whose access has ended` : undefined}>
            {c.label} <b>{c.n}</b>{c.ended > 0 && <span className="pr-chip-ended"> · {c.ended} ended</span>}
          </button>
        ))}
      </div>
      <input className="pr-search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
             placeholder="Search name, code, email or phone" aria-label="Search students" />
    </div>
  );
  const byId: Record<string, Student> = {};
  for (const st of students) byId[st.id] = st;

  /* ---- per-student roll-up from the attempt rows ---- */
  const roll = students.map((st) => {
    const mine = attempts.filter((a) => a.student_id === st.id);
    return {
      st,
      areas: summarise(mine, wbands.filter((w) => w.student_id === st.id)),
      count: mine.length,
      when: mine.length ? mine[0].submitted_at : null,
    };
  }).sort((a, b) => (b.when ?? "").localeCompare(a.when ?? ""));

  const done = roll.filter((r) => r.count > 0);
  /* centre average per skill: each student's latest band in that skill */
  const centre = (["L", "RA", "RG", "W"] as const).map((k) => {
    const latest = roll.map((r) => r.areas.find((a) => a.key === k)?.latest).filter((b): b is number => b != null);
    return {
      k, n: latest.length,
      label: k === "L" ? "Listening" : k === "RA" ? "Academic Reading" : k === "RG" ? "GT Reading" : "Writing",
      avg: latest.length ? latest.reduce((x, y) => x + y, 0) / latest.length : 0,
    };
  }).filter((c) => c.n > 0);

  /* ---- what the whole centre gets wrong, by question type ----
     The list view only carries scores, not per-question detail, so this fills
     in as students are opened. Splitting reading from listening matters: the
     same named skill behaves differently under time pressure with audio. */
  const centreR: { correct: boolean; type?: string }[] = [];
  const centreL: { correct: boolean; type?: string }[] = [];
  for (const a of attempts) {
    const into = a.skill === "AR" || a.skill === "GR" ? centreR : centreL;
    for (const q of a.per_question ?? []) if (q.type) into.push(q);
  }
  const classReading = byType(centreR);
  const classListening = byType(centreL);

  /* ================= one student, opened ================= */
  if (open) {
    const st = open.student;
    const areas = summarise(open.attempts, open.writings);
    const rowsR: { correct: boolean; type?: string }[] = [];
    const rowsL: { correct: boolean; type?: string }[] = [];
    for (const a of open.attempts) {
      const into = a.skill === "AR" || a.skill === "GR" ? rowsR : rowsL;
      for (const q of a.per_question ?? []) if (q.type) into.push(q);
    }
    const weakR = byType(rowsR);
    const weakL = byType(rowsL);

    return (
      <div className="wrap">
        <button className="btn ghost" type="button" style={{ marginTop: 20 }} onClick={() => setOpen(null)}>
          &larr; All students
        </button>
        <div className="pr-head">
          <h1>{st?.full_name ?? "Student"}</h1>
          <span className="meta">{st?.code}{st?.batch ? " \u00b7 " + st.batch : ""} · {open.attempts.length} attempt{open.attempts.length === 1 ? "" : "s"}</span>
        </div>

        {areas.length > 0 && (
          <section className="pr-set">
            <h2>Bands by skill</h2>
            <SkillCards areas={areas} who="student" />
          </section>
        )}

        {open.attempts.length === 0 ? (
          <div className="pr-note">This student has not finished a test yet.</div>
        ) : (
          <>

            {!weakR.length && !weakL.length && (
              <div className="pr-note">
                Question-type detail appears from their next test onward.
              </div>
            )}
            {([["Reading", weakR], ["Listening", weakL]] as const).map(([title, rows]) =>
              rows.length ? (
                <section className="pr-set" key={title}>
                  <h2>{title} — accuracy by question type</h2>
                  <div className="pr-rows">
                    {rows.map((w) => (
                      <div className="pr-row" key={w.type}>
                        <div>
                          <div className="nm">{w.type}</div>
                          <div className="fx">
                            <span>{w.right} right of {w.total}</span>
                            {w.total < 5 && <span>small sample</span>}
                          </div>
                        </div>
                        <div className="pr-meter"><i style={{ width: `${Math.min(100, w.pctRight)}%` }} /></div>
                        <span className={"pr-band " + (w.pctRight >= 75 ? "hi" : w.pctRight >= 50 ? "mid" : "lo")}>
                          {w.pctRight.toFixed(0)}% correct
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null,
            )}

            <section className="pr-set">
              <h2>Every attempt</h2>
              <div className="pr-rows">
                {open.attempts.map((a) => (
                  <div className="pr-row" key={a.id}>
                    <div>
                      <div className="nm">{names[a.test_id] ?? a.test_id}</div>
                      <div className="fx">
                        <span>{SKILL_NAME[a.skill] ?? a.skill}</span>
                        <span>{new Date(a.submitted_at).toLocaleString()}</span>
                        <span>{a.raw_score}/{a.total} correct</span>
                      </div>
                    </div>
                    {/* Open what the student actually wrote, question by
                        question, beside the passage it came from. */}
                    <a className="btn btn-outline" href={`/practice/results/${a.id}`}
                      target="_blank" rel="noreferrer"
                      style={{ padding: "7px 13px", fontSize: "0.8rem", minHeight: 38 }}>
                      Review
                    </a>
                    <span className={"pr-band " + (Number(a.band) >= 7 ? "hi" : Number(a.band) >= 5.5 ? "mid" : "lo")}>
                      <span className="lb">band</span>{Number(a.band).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* This student's writing, newest first — open one to check it with the pen. */}
        <section className="pr-set">
          <h2>Writing</h2>
          {open.writings.length === 0 ? (
            <div className="pr-note">No writing saved by this student yet.</div>
          ) : (
            <div className="pr-rows">
              {open.writings.map((x) => (
                <div className="pr-row" key={x.id}>
                  <div>
                    <div className="nm">
                      {x.kind === "task2" ? "Task 2" : x.kind === "gt1" ? "GT letter" : "Academic Task 1"} · {x.question.split("\n")[0].slice(0, 70)}{x.question.length > 70 ? "…" : ""}
                    </div>
                    <div className="fx">
                      <span>{new Date(x.submitted_at).toLocaleString()}</span>
                      <span>{x.words} words</span>
                      {x.auto_band != null && <span>auto {Number(x.auto_band).toFixed(1)}</span>}
                    </div>
                  </div>
                  <a className={x.status === "checked" ? "btn btn-outline" : "btn btn-coral"} href={`/practice/teacher/writing/${x.id}`}
                    style={{ padding: "7px 13px", fontSize: "0.8rem", minHeight: 38 }}>
                    {x.status === "checked" ? "Open" : "Check"}
                  </a>
                  {x.status === "checked" && x.teacher_band != null ? (
                    <span className={"pr-band " + (Number(x.teacher_band) >= 7 ? "hi" : Number(x.teacher_band) >= 5.5 ? "mid" : "lo")}>
                      <span className="lb">band</span>{Number(x.teacher_band).toFixed(1)}
                    </span>
                  ) : (
                    <span className="pr-band none">{x.status === "checked" ? "checked" : "new"}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  /* ================= overview ================= */
  return (
    <div className="wrap">
      <div className="pr-head">
        <h1>Teacher</h1>
        <span className="meta">{live} active · {attempts.length} attempt{attempts.length === 1 ? "" : "s"} recorded</span>
      </div>

      <nav className="pr-skills" aria-label="View">
        <a onClick={() => setTab("results")} aria-current={tab === "results" ? "page" : undefined}
           style={{ cursor: "pointer" }}>Results</a>
        <a onClick={() => setTab("writing")} aria-current={tab === "writing" ? "page" : undefined}
           style={{ cursor: "pointer" }}>Writing to check</a>
        <a onClick={() => setTab("people")} aria-current={tab === "people" ? "page" : undefined}
           style={{ cursor: "pointer" }}>Students</a>
      </nav>

      {justMade && (
        <div className="pr-note">
          <b>Give this to {justMade.name}:</b> code <b>{justMade.code}</b>, PIN <b>{justMade.pin}</b>.
          <br />Write it down now — the PIN is stored scrambled and cannot be read back later.
        </div>
      )}
      {err && <div className="pr-err">{err}</div>}

      {tab === "results" && (
        <>
          {attempts.length === 0 ? (
            <div className="pr-note">
              No tests have been completed yet. Once students start finishing papers,
              their bands, progress and weak areas appear here.
            </div>
          ) : (
            <>
              <div className="pr-stats">
                <div className="pr-stat"><span className="v">{done.length}</span><span className="k">Students active</span></div>
                <div className="pr-stat"><span className="v">{attempts.length}</span><span className="k">Tests done</span></div>
                <div className="pr-stat"><span className="v">{wbands.length}</span><span className="k">Writings saved</span></div>
              </div>
              {centre.length > 0 && (
                <section className="pr-set">
                  <h2>Centre average by skill</h2>
                  <p style={{ color: "var(--grey)", fontSize: "0.84rem", margin: "0 0 4px" }}>
                    Each student&apos;s latest band in that skill, averaged. The number after the skill is how many students.
                  </p>
                  <div className="pr-stats" style={{ gridTemplateColumns: `repeat(${centre.length}, 1fr)`, marginTop: 8 }}>
                    {centre.map((c) => (
                      <div className="pr-stat" key={c.k}>
                        <span className="v">{c.avg.toFixed(1)}</span>
                        <span className="k">{c.label} · {c.n}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!classReading.length && !classListening.length ? (
                <div className="pr-note">
                  Open a student below to load their question-level detail, and this
                  fills in with what the centre as a whole finds hardest.
                </div>
              ) : (
                ([["Reading", classReading], ["Listening", classListening]] as const).map(([title, rows]) =>
                  rows.length ? (
                    <section className="pr-set" key={title}>
                      {/* The teacher's own view stays blunt: this list exists
                          to pick next week's lesson, and "hardest" is the
                          useful ordering. */}
                      <h2>{title} — hardest for the centre</h2>
                      <div className="pr-rows">
                        {rows.map((w) => (
                          <div className="pr-row" key={w.type}>
                            <div>
                              <div className="nm">{w.type}</div>
                              <div className="fx">
                                <span>{w.right} right of {w.total} across all students</span>
                              </div>
                            </div>
                            <div className="pr-meter"><i style={{ width: `${Math.min(100, w.pctRight)}%` }} /></div>
                            <span className={"pr-band " + (w.pctRight >= 75 ? "hi" : w.pctRight >= 50 ? "mid" : "lo")}>
                              {w.pctRight.toFixed(0)}% correct
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null,
                )
              )}
            </>
          )}

          <section className="pr-set">
            <h2>Students</h2>
            {filterBar}
            <div className="pr-rows">
              {roll.filter((r) => matches(r.st)).length === 0 && (
                <div className="pr-row"><div className="nm">No students match.</div></div>
              )}
              {roll.filter((r) => matches(r.st)).map((r) => (
                <div className="pr-row" key={r.st.id}>
                  <div>
                    <div className="nm">
                      {r.st.full_name} {!r.st.active && <span className="pr-off">off</span>}
                    </div>
                    <div className="fx">
                      <span>{r.st.code}</span>
                      {r.st.batch && <span>{r.st.batch}</span>}
                      <span>{r.count} test{r.count === 1 ? "" : "s"}</span>
                      {r.when && <span>last {new Date(r.when).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  {/* latest band in each skill, side by side, so the weak one shows at a glance */}
                  {r.areas.length ? (
                    <div className="sk-chips">
                      {r.areas.map((a) => (
                        <span key={a.key} title={`${a.label}: latest ${a.latest.toFixed(1)}, best ${a.best.toFixed(1)}, average ${a.avg.toFixed(1)} over ${a.count}`}
                              className={"pr-band " + (a.latest >= 7 ? "hi" : a.latest >= 5.5 ? "mid" : "lo")}>
                          <span className="lb">{a.key === "L" ? "L" : a.key === "W" ? "W" : a.key === "RA" ? "R" : "R·GT"}</span>{a.latest.toFixed(1)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="pr-band none">no tests</span>
                  )}
                  <div className="go">
                    <button className="btn ghost" type="button" onClick={() => openStudent(r.st)}>
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === "writing" && (
        <section className="pr-set">
          <h2>Students&apos; writing</h2>
          <nav className="wr-types" aria-label="Show" style={{ marginBottom: 12 }}>
            <a onClick={() => setWFilter("todo")} aria-current={wFilter === "todo" ? "page" : undefined} style={{ cursor: "pointer" }}>
              To check <span>{writings?.filter((x) => x.status !== "checked").length ?? 0}</span>
            </a>
            <a onClick={() => setWFilter("all")} aria-current={wFilter === "all" ? "page" : undefined} style={{ cursor: "pointer" }}>
              All <span>{writings?.length ?? 0}</span>
            </a>
          </nav>
          {writings === null ? (
            <div className="pr-note">Loading…</div>
          ) : (
            <div className="pr-rows">
              {writings.filter((x) => wFilter === "all" || x.status !== "checked").length === 0 && (
                <div className="pr-note">
                  {wFilter === "todo" ? "Nothing waiting — every piece of writing has been checked." : "No writing has been saved yet."}
                </div>
              )}
              {writings.filter((x) => wFilter === "all" || x.status !== "checked").map((x) => (
                <div className="pr-row" key={x.id}>
                  <div>
                    <div className="nm">
                      {x.students?.full_name ?? "Student"} · {x.kind === "task2" ? "Task 2" : x.kind === "gt1" ? "GT letter" : "Academic Task 1"}
                    </div>
                    <div className="fx">
                      <span>{x.question.split("\n")[0].slice(0, 70)}{x.question.length > 70 ? "…" : ""}</span>
                      <span>{x.words} words</span>
                      <span>{new Date(x.submitted_at).toLocaleString()}</span>
                      {x.auto_band != null && <span>auto {Number(x.auto_band).toFixed(1)}</span>}
                    </div>
                  </div>
                  <a className={x.status === "checked" ? "btn btn-outline" : "btn btn-coral"} href={`/practice/teacher/writing/${x.id}`}
                    style={{ padding: "7px 13px", fontSize: "0.8rem", minHeight: 38 }}>
                    {x.status === "checked" ? "Open" : "Check"}
                  </a>
                  {x.status === "checked" && x.teacher_band != null ? (
                    <span className={"pr-band " + (Number(x.teacher_band) >= 7 ? "hi" : Number(x.teacher_band) >= 5.5 ? "mid" : "lo")}>
                      <span className="lb">band</span>{Number(x.teacher_band).toFixed(1)}
                    </span>
                  ) : (
                    <span className="pr-band none">{x.status === "checked" ? "checked" : "new"}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "people" && (
        <>
          {/* Why didn't a student get their login? The list below shows whether
              the login was made; this shows whether the site can take payments
              and send email at all. */}
          <section className="pr-set">
            <h2>Online payments</h2>
            {!check ? (
              <button className="btn ghost" type="button" onClick={runCheck}>Check online payment setup</button>
            ) : (
              <div className="pr-note" style={{ marginTop: 0 }}>
                {check.missing.length ? (
                  <><b>Not ready — Pay now is hidden.</b> Missing in Vercel: {check.missing.join(", ")}. Add them, then redeploy.</>
                ) : (
                  <><b>Ready.</b> Pay now is shown on the course pages{check.keyMode ? ` (Razorpay ${check.keyMode} keys)` : ""}.</>
                )}
                <div style={{ marginTop: 6 }}>
                  Emails are sent from <b>{check.mailFrom || "—"}</b>; enrolment copies go to <b>{check.owner || "nobody (OWNER_EMAIL not set)"}</b>.
                  Links in emails point to {check.site}.
                </div>
                {check.mail && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center" }}>
                    <input value={mailTo} onChange={(e) => setMailTo(e.target.value)} placeholder="your@email.com"
                           style={{ flex: "1 1 220px", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--grey-light)", font: "inherit" }} />
                    <button className="btn" type="button" onClick={testMail} disabled={busy}>Send a test email</button>
                  </div>
                )}
                {mailResult && <div style={{ marginTop: 8, fontWeight: 600 }}>{mailResult}</div>}
              </div>
            )}
          </section>

          <section className="pr-set">
            <h2>Add a student</h2>
            <form className="pr-form" onSubmit={addStudent}>
              <div>
                <label htmlFor="f-code">Student code</label>
                <input id="f-code" value={form.code} placeholder="PEC-0001" autoCapitalize="characters"
                       onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label htmlFor="f-name">Full name</label>
                <input id="f-name" value={form.full_name}
                       onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="f-batch">Batch</label>
                <input id="f-batch" value={form.batch} placeholder="Morning"
                       onChange={(e) => setForm({ ...form, batch: e.target.value })} />
              </div>
              <div>
                <label htmlFor="f-pin">PIN (4–8 digits)</label>
                <input id="f-pin" value={form.pin} inputMode="numeric" placeholder="1234"
                       onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>This login opens</label>
                <div className="pr-access">
                  {AREAS.map((a) => (
                    <label key={a.key}>
                      <input type="checkbox" checked={form.access.includes(a.key)}
                             onChange={() => setForm({ ...form, access: flip(form.access, a.key) })} />
                      {a.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="pr-form-go">
                <button className="btn" type="submit" disabled={busy}>Add student</button>
              </div>
            </form>
          </section>

          <section className="pr-set">
            <h2>All students</h2>
            {filterBar}
            <div className="pr-rows">
              {students.filter(matches).length === 0 && (
                <div className="pr-row"><div className="nm">{students.length ? "No students match." : "Nobody yet."}</div></div>
              )}
              {students.filter(matches).map((s2) => (
                <div className="pr-row" key={s2.id}>
                  <div>
                    <div className="nm">{s2.full_name} {!s2.active && <span className="pr-off">off</span>}</div>
                    <div className="fx">
                      <span>{s2.code}</span>
                      {s2.email && <span>{s2.email}</span>}
                      {s2.phone && <span>{s2.phone}</span>}
                      {s2.batch && <span>{s2.batch}</span>}
                      <span className="pr-opens">
                        {access[s2.id]
                          ? access[s2.id].map((k) => {
                              const end = until[s2.id]?.[k];
                              if (!end) return areaLabel(k);
                              const over = Date.parse(end) <= Date.now();
                              return `${areaLabel(k)} (${over ? "ended" : "until"} ${shortDate(end)})`;
                            }).join(" + ")
                          : "Opens everything"}
                      </span>
                    </div>
                    {editing?.id === s2.id && (
                      <div className="pr-access" style={{ marginTop: 8 }}>
                        {AREAS.map((a) => (
                          <label key={a.key}>
                            <input type="checkbox" checked={editing.areas.includes(a.key)}
                                   onChange={() => setEditing({ ...editing, areas: flip(editing.areas, a.key) })} />
                            {a.label}
                            {until[s2.id]?.[a.key] && editing.areas.includes(a.key) && (
                              editing.clear.includes(a.key) ? (
                                <em className="pr-until"> · no end date</em>
                              ) : (
                                <button type="button" className="pr-untilbtn" title="Remove the end date: open with no time limit"
                                        onClick={(e) => { e.preventDefault(); setEditing({ ...editing, clear: [...editing.clear, a.key] }); }}>
                                  {Date.parse(until[s2.id][a.key]) <= Date.now() ? "ended" : "until"} {shortDate(until[s2.id][a.key])} ✕
                                </button>
                              )
                            )}
                          </label>
                        ))}
                        <button className="btn" type="button" onClick={saveAccess} disabled={busy || !editing.areas.length}>
                          Save
                        </button>
                        <button className="btn ghost" type="button" onClick={() => setEditing(null)}>Cancel</button>
                      </div>
                    )}
                  </div>
                  <div className="go go-many" style={{ display: "flex", gap: 8 }}>
                    <button className="btn ghost" type="button" disabled={busy}
                            onClick={() => setEditing({ id: s2.id, areas: access[s2.id] ?? AREAS.map((a) => a.key), clear: [] })}>
                      Modules
                    </button>
                    <button className="btn ghost" type="button" onClick={() => resetPin(s2)} disabled={busy}>
                      Reset PIN
                    </button>
                    <button className="btn ghost" type="button" onClick={() => toggle(s2)} disabled={busy}>
                      {s2.active ? "Switch off" : "Switch on"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
