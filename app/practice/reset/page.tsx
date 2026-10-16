"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetForm() {
  const token = useSearchParams().get("t") || "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [code, setCode] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw !== pw2) { setErr("The two passwords are not the same."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/practice/reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setErr(data.error || "Something went wrong.");
      else setCode(data.code);
    } catch { setErr("No connection. Check your internet and try again."); }
    setBusy(false);
  }

  if (!token) {
    return (
      <div className="pr-signin">
        <h1>Reset link missing</h1>
        <p className="lede">Open the link from your email, or ask for a new one.</p>
        <Link className="btn" href="/practice/forgot" style={{ width: "100%", justifyContent: "center" }}>Forgot password</Link>
      </div>
    );
  }
  if (code) {
    return (
      <div className="pr-signin">
        <h1>Password changed</h1>
        <p className="lede">Sign in with student code <b>{code}</b> (or your email) and your new password.</p>
        <Link className="btn" href="/practice/sign-in" style={{ width: "100%", justifyContent: "center" }}>Sign in</Link>
      </div>
    );
  }
  return (
    <div className="pr-signin">
      <h1>Choose a new password</h1>
      <p className="lede">At least 6 characters. You will use it with your student code or email.</p>
      <form onSubmit={submit}>
        <label htmlFor="pw">New password</label>
        <input id="pw" type="password" value={pw} autoFocus autoComplete="new-password" onChange={(e) => setPw(e.target.value)} />
        <label htmlFor="pw2">Type it again</label>
        <input id="pw2" type="password" value={pw2} autoComplete="new-password" onChange={(e) => setPw2(e.target.value)} />
        {err && <div className="pr-err">{err}</div>}
        {err.includes("expired") ? (
          <Link className="btn" href="/practice/forgot" style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>Ask for a new link</Link>
        ) : (
          <button className="btn" type="submit" disabled={busy || pw.length < 6}>{busy ? "Saving…" : "Save new password"}</button>
        )}
      </form>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="pr-signin"><h1>Choose a new password</h1></div>}>
      <ResetForm />
    </Suspense>
  );
}
