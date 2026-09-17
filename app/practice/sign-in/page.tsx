"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignInForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/practice";

  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [stuck, setStuck] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/practice/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error || "Could not sign you in."); setBusy(false); return; }

      // A full page load, not a client-side navigation. The App Router keeps a
      // cache of the pages it has visited, and /practice is in it as "middleware
      // sent me to the sign-in page" from a moment ago — so router.replace()
      // serves that cached answer and lands the student straight back here,
      // signed in but looking at the sign-in form. Reloading makes the browser
      // ask the server again, with the new cookie attached.
      const to = next.startsWith("/practice") ? next : "/practice";
      window.location.replace(to);

      // If the browser has not moved on after a few seconds, say so rather than
      // leaving "Signing in…" on screen for ever.
      setTimeout(() => {
        setBusy(false);
        setErr("Signed in, but the page did not move on. Tap Continue below.");
        setStuck(to);
      }, 4000);
    } catch {
      setErr("No connection. Check your internet and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="pr-signin">
      <h1>Student sign in</h1>
      <p className="lede">
        The practice tests are for enrolled Pioneer students. Use the code and PIN
        your teacher gave you.
      </p>

      <form onSubmit={submit}>
        <label htmlFor="code">Student code</label>
        <input
          id="code" value={code} autoFocus autoComplete="username"
          autoCapitalize="characters" spellCheck={false} placeholder="PEC-0000"
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />

        <label htmlFor="pin">PIN</label>
        <input
          id="pin" value={pin} type="password" inputMode="numeric"
          autoComplete="current-password" placeholder="••••"
          onChange={(e) => setPin(e.target.value)}
        />

        {err && <div className="pr-err">{err}</div>}

        {stuck ? (
          <a className="btn" href={stuck} style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
            Continue →
          </a>
        ) : (
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        )}
      </form>

      <p className="pr-help">
        Forgotten your code or PIN? Ask Narinder Sir — he can reset it for you.
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="pr-signin"><h1>Student sign in</h1></div>}>
      <SignInForm />
    </Suspense>
  );
}
