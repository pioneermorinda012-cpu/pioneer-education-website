"use client";

import { useCallback, useEffect, useState } from "react";

type Student = {
  id: string; code: string; full_name: string;
  batch: string | null; track: string; active: boolean; created_at: string;
};
type Att = {
  id: string; student_id: string; test_id: string; skill: string;
  raw_score: number; total: number; band: number; submitted_at: string;
  per_question?: { n: string; correct: boolean; given: string; expected: string }[];
};
const SKILL_NAME: Record<string, string> = {
  AL: "Academic Listening", AR: "Academic Reading", GL: "GT Listening", GR: "GT Reading",
};

export default function TeacherPage() {
  const [state, setState] = useState<"loading" | "setup" | "locked" | "in">("loading");
  const [missing, setMissing] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attempts, setAttempts] = useState<Att[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"results" | "people">("results");
  const [open, setOpen] = useState<{ student: Student | null; attempts: Att[] } | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [teacherCode, setTeacherCode] = useState("");
  const [form, setForm] = useState({ code: "", full_name: "", batch: "", pin: "", track: "academic" });
  const [justMade, setJustMade] = useState<{ code: string; pin: string; name: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/practice/teacher", { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    if (!d.configured) { setMissing(d.missing ?? []); setState("setup"); return; }
    if (!d.authed) { setState("locked"); return; }
    setStudents(d.students ?? []);
    setAttempts(d.attempts ?? []);
    setNames(d.names ?? {});
    if (d.error) setErr(d.error);
    setState("in");
  }, []);

  useEffect(() => { load(); }, [load]);

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
    if (await post({ action: "create", ...form })) {
      setJustMade(made);
      setForm({ code: "", full_name: "", batch: form.batch, pin: "", track: form.track });
      load();
    }
  }

  async function openStudent(s: Student) {
    setErr("");
    const res = await fetch(`/api/practice/teacher?student=${encodeURIComponent(s.id)}`, { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    setOpen({ student: d.student ?? s, attempts: d.attempts ?? [] });
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
  const byId: Record<string, Student> = {};
  for (const st of students) byId[st.id] = st;

  /* ---- per-student roll-up from the attempt rows ---- */
  const roll = students.map((st) => {
    const mine = attempts.filter((a) => a.student_id === st.id);
    const bands = mine.map((a) => Number(a.band));
    return {
      st,
      count: mine.length,
      best: bands.length ? Math.max(...bands) : null,
      last: bands.length ? bands[0] : null,
      when: mine.length ? mine[0].submitted_at : null,
      trend: bands.length >= 2 ? bands[0] - bands[bands.length - 1] : null,
    };
  }).sort((a, b) => (b.when ?? "").localeCompare(a.when ?? ""));

  const done = roll.filter((r) => r.count > 0);
  const centreAvg = done.length
    ? done.reduce((s2, r) => s2 + (r.best ?? 0), 0) / done.length : 0;

  /* ---- which quarter of the paper the whole centre struggles with ---- */
  const quarters: Record<string, { wrong: number; total: number }> = {};
  for (const a of attempts) {
    for (const q of a.per_question ?? []) {
      const n = Number(q.n);
      const k = n <= 10 ? "Questions 1\u201310" : n <= 20 ? "Questions 11\u201320"
        : n <= 30 ? "Questions 21\u201330" : "Questions 31\u201340";
      const slot = (quarters[k] ??= { wrong: 0, total: 0 });
      slot.total++; if (!q.correct) slot.wrong++;
    }
  }
  const classWeak = Object.entries(quarters)
    .map(([label, v]) => ({ label, pct: v.total ? (v.wrong / v.total) * 100 : 0, ...v }))
    .sort((a, b) => b.pct - a.pct);

  /* ================= one student, opened ================= */
  if (open) {
    const st = open.student;
    const bands = open.attempts.map((a) => Number(a.band));
    const qw: Record<string, { wrong: number; total: number }> = {};
    for (const a of open.attempts) {
      for (const q of a.per_question ?? []) {
        const n = Number(q.n);
        const k = n <= 10 ? "Questions 1\u201310" : n <= 20 ? "Questions 11\u201320"
          : n <= 30 ? "Questions 21\u201330" : "Questions 31\u201340";
        const slot = (qw[k] ??= { wrong: 0, total: 0 });
        slot.total++; if (!q.correct) slot.wrong++;
      }
    }
    const weak = Object.entries(qw)
      .map(([label, v]) => ({ label, pct: v.total ? (v.wrong / v.total) * 100 : 0, ...v }))
      .sort((a, b) => b.pct - a.pct);

    return (
      <div className="wrap">
        <button className="btn ghost" type="button" style={{ marginTop: 20 }} onClick={() => setOpen(null)}>
          &larr; All students
        </button>
        <div className="pr-head">
          <h1>{st?.full_name ?? "Student"}</h1>
          <span className="meta">{st?.code}{st?.batch ? " \u00b7 " + st.batch : ""} \u00b7 {open.attempts.length} attempt{open.attempts.length === 1 ? "" : "s"}</span>
        </div>

        {open.attempts.length === 0 ? (
          <div className="pr-note">This student has not finished a test yet.</div>
        ) : (
          <>
            <div className="pr-stats">
              <div className="pr-stat"><span className="v">{Math.max(...bands).toFixed(1)}</span><span className="k">Best band</span></div>
              <div className="pr-stat"><span className="v">{bands[0].toFixed(1)}</span><span className="k">Most recent</span></div>
              <div className="pr-stat"><span className="v">{(bands.reduce((a, b) => a + b, 0) / bands.length).toFixed(1)}</span><span className="k">Average</span></div>
            </div>

            <section className="pr-set">
              <h2>Where this student loses marks</h2>
              <div className="pr-rows">
                {weak.map((w) => (
                  <div className="pr-row" key={w.label}>
                    <div>
                      <div className="nm">{w.label}</div>
                      <div className="fx"><span>{w.wrong} wrong of {w.total}</span></div>
                    </div>
                    <div className="pr-meter"><i style={{ width: `${Math.min(100, w.pct)}%` }} /></div>
                    <span className="pr-band none">{w.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="pr-set">
              <h2>Every attempt</h2>
              <div className="pr-rows">
                {open.attempts.map((a) => (
                  <div className="pr-row" key={a.id}>
                    <div>
                      <div className="nm">{names[a.test_id] ?? a.test_id}</div>
                      <div className="fx">
                        <span>{new Date(a.submitted_at).toLocaleString()}</span>
                        <span>{a.raw_score}/{a.total} correct</span>
                      </div>
                    </div>
                    <span className={"pr-band " + (Number(a.band) >= 7 ? "hi" : Number(a.band) >= 5.5 ? "mid" : "lo")}>
                      <span className="lb">band</span>{Number(a.band).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    );
  }

  /* ================= overview ================= */
  return (
    <div className="wrap">
      <div className="pr-head">
        <h1>Teacher</h1>
        <span className="meta">{live} active \u00b7 {attempts.length} attempt{attempts.length === 1 ? "" : "s"} recorded</span>
      </div>

      <nav className="pr-skills" aria-label="View">
        <a onClick={() => setTab("results")} aria-current={tab === "results" ? "page" : undefined}
           style={{ cursor: "pointer" }}>Results</a>
        <a onClick={() => setTab("people")} aria-current={tab === "people" ? "page" : undefined}
           style={{ cursor: "pointer" }}>Students</a>
      </nav>

      {justMade && (
        <div className="pr-note">
          <b>Give this to {justMade.name}:</b> code <b>{justMade.code}</b>, PIN <b>{justMade.pin}</b>.
          <br />Write it down now \u2014 the PIN is stored scrambled and cannot be read back later.
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
                <div className="pr-stat"><span className="v">{centreAvg.toFixed(1)}</span><span className="k">Average best band</span></div>
              </div>

              <section className="pr-set">
                <h2>What the whole centre finds hardest</h2>
                <div className="pr-rows">
                  {classWeak.map((w) => (
                    <div className="pr-row" key={w.label}>
                      <div>
                        <div className="nm">{w.label}</div>
                        <div className="fx"><span>{w.wrong} wrong of {w.total} across all students</span></div>
                      </div>
                      <div className="pr-meter"><i style={{ width: `${Math.min(100, w.pct)}%` }} /></div>
                      <span className="pr-band none">{w.pct.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <section className="pr-set">
            <h2>Students</h2>
            <div className="pr-rows">
              {roll.map((r) => (
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
                  {r.best != null ? (
                    <span className={"pr-band " + (r.best >= 7 ? "hi" : r.best >= 5.5 ? "mid" : "lo")}>
                      <span className="lb">best</span>{r.best.toFixed(1)}
                      {r.trend != null && r.trend !== 0 && (
                        <span className="lb" style={{ marginLeft: 4 }}>
                          {r.trend > 0 ? "\u2191" : "\u2193"}{Math.abs(r.trend).toFixed(1)}
                        </span>
                      )}
                    </span>
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

      {tab === "people" && (
        <>
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
                <label htmlFor="f-pin">PIN (4\u20138 digits)</label>
                <input id="f-pin" value={form.pin} inputMode="numeric" placeholder="1234"
                       onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} />
              </div>
              <div>
                <label htmlFor="f-track">Track</label>
                <select id="f-track" value={form.track}
                        onChange={(e) => setForm({ ...form, track: e.target.value })}>
                  <option value="academic">Academic</option>
                  <option value="gt">General Training</option>
                </select>
              </div>
              <div className="pr-form-go">
                <button className="btn" type="submit" disabled={busy}>Add student</button>
              </div>
            </form>
          </section>

          <section className="pr-set">
            <h2>All students</h2>
            <div className="pr-rows">
              {students.length === 0 && <div className="pr-row"><div className="nm">Nobody yet.</div></div>}
              {students.map((s2) => (
                <div className="pr-row" key={s2.id}>
                  <div>
                    <div className="nm">{s2.full_name} {!s2.active && <span className="pr-off">off</span>}</div>
                    <div className="fx">
                      <span>{s2.code}</span>
                      {s2.batch && <span>{s2.batch}</span>}
                      <span>{s2.track === "gt" ? "General Training" : "Academic"}</span>
                    </div>
                  </div>
                  <div className="go" style={{ display: "flex", gap: 8 }}>
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
