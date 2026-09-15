"use client";

import { useCallback, useEffect, useState } from "react";

type Student = {
  id: string; code: string; full_name: string;
  batch: string | null; track: string; active: boolean; created_at: string;
};

export default function TeacherPage() {
  const [state, setState] = useState<"loading" | "setup" | "locked" | "in">("loading");
  const [missing, setMissing] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
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

  return (
    <div className="wrap">
      <div className="pr-head">
        <h1>Students</h1>
        <span className="meta">{live} active · {students.length} total</span>
      </div>

      {justMade && (
        <div className="pr-note">
          <b>Give this to {justMade.name}:</b> code <b>{justMade.code}</b>, PIN <b>{justMade.pin}</b>.
          <br />Write it down now — the PIN is stored scrambled and cannot be read back later.
        </div>
      )}
      {err && <div className="pr-err">{err}</div>}

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
          {students.map((s) => (
            <div className="pr-row" key={s.id}>
              <div>
                <div className="nm">{s.full_name} {!s.active && <span className="pr-off">off</span>}</div>
                <div className="fx">
                  <span>{s.code}</span>
                  {s.batch && <span>{s.batch}</span>}
                  <span>{s.track === "gt" ? "General Training" : "Academic"}</span>
                </div>
              </div>
              <div className="go" style={{ display: "flex", gap: 8 }}>
                <button className="btn ghost" type="button" onClick={() => resetPin(s)} disabled={busy}>
                  Reset PIN
                </button>
                <button className="btn ghost" type="button" onClick={() => toggle(s)} disabled={busy}>
                  {s.active ? "Switch off" : "Switch on"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
