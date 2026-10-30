"use client";

import { useState } from "react";
import Link from "next/link";
import Turnstile, { TURNSTILE_SITE_KEY } from "@/components/Turnstile";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState("");
  const [tsToken, setTsToken] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/practice/forgot", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, turnstile: tsToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setErr(data.error || "Something went wrong.");
      else setDone(data.message);
    } catch { setErr("No connection. Check your internet and try again."); }
    setBusy(false);
  }

  return (
    <div className="pr-signin">
      <h1>Forgot password</h1>
      <p className="lede">
        Enter the email address you paid with. We email you a link to choose a new password.
      </p>
      {done ? (
        <>
          <div className="pr-help" style={{ fontSize: "1rem" }}>{done}</div>
          <Link className="btn" href="/practice/sign-in" style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
            Back to sign in
          </Link>
        </>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" value={email} autoFocus autoComplete="email"
            placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} />
          {err && <div className="pr-err">{err}</div>}
          <Turnstile onToken={setTsToken} />
          <button className="btn" type="submit" disabled={busy || !email.trim() || (!!TURNSTILE_SITE_KEY && !tsToken)}>
            {busy ? "Sending…" : "Email me a reset link"}
          </button>
        </form>
      )}
      <p className="pr-help">
        Joined at the centre and never gave an email? Ask Narinder Sir — he can reset it for you.
      </p>
    </div>
  );
}
