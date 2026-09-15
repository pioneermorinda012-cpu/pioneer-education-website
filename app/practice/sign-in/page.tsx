"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/practice";

  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

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
      router.replace(next.startsWith("/practice") ? next : "/practice");
      router.refresh();
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

        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
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
