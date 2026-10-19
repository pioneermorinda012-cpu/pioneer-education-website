"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Phase = "form" | "waiting" | "done" | "fallback";

const titleStyle: React.CSSProperties = {
  fontFamily: "Fraunces, serif", fontSize: "2.2rem", color: "var(--navy)", margin: "0 0 16px",
};
const pStyle: React.CSSProperties = { fontSize: "1.05rem", lineHeight: 1.7, color: "var(--ink)" };
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, margin: "12px 0 4px", color: "var(--ink)",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 15,
};
const errStyle: React.CSSProperties = {
  background: "#fdeaea", color: "#9c2b2b", padding: "8px 12px", borderRadius: 8, fontSize: 13.5, marginTop: 10,
};

export default function ThankYouBody({ waHref }: { waHref: string }) {
  const params = useSearchParams();
  const paymentId = params.get("razorpay_payment_id") || "";
  const linkId = params.get("razorpay_payment_link_id") || "";
  const referenceId = params.get("razorpay_payment_link_reference_id") || "";
  const status = params.get("razorpay_payment_link_status") || "";
  const signature = params.get("razorpay_signature") || "";
  const hasParams = Boolean(paymentId && linkId && status && signature);

  const [phase, setPhase] = useState<Phase>(hasParams ? "form" : "fallback");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const tries = useRef(0);

  async function tryClaim(password: string) {
    try {
      const res = await fetch("/api/razorpay/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, linkId, referenceId, status, signature, password }),
      });
      if (res.status === 202) {
        // the webhook that actually creates the account can land a couple of
        // seconds after this redirect — try a few more times before giving up
        tries.current += 1;
        if (tries.current < 10) { setTimeout(() => tryClaim(password), 2000); return; }
        setErr("Still setting up your account. Check your email for your login in a minute, or reload this page.");
        setPhase("fallback");
        setBusy(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Could not set your password just now.");
        setPhase("fallback");
        setBusy(false);
        return;
      }
      setCode(data.code || "");
      setPhase("done");
      setBusy(false);
    } catch {
      setErr("No connection. Check your internet and try again.");
      setPhase("form");
      setBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw !== pw2) { setErr("The two passwords are not the same."); return; }
    if (pw.length < 6) { setErr("Use at least 6 characters."); return; }
    setBusy(true);
    setPhase("waiting");
    tries.current = 0;
    tryClaim(pw);
  }

  if (phase === "done") {
    return (
      <>
        <h1 style={titleStyle}>You&rsquo;re all set — welcome aboard.</h1>
        <p style={pStyle}>
          Your password is saved and you&rsquo;re signed in{code ? <> — your student code is <b>{code}</b></> : ""}.
          Keep the code safe; you can sign in with it (or your email) next time.
        </p>
        <div className="hero-ctas" style={{ marginTop: 24 }}>
          <Link href="/practice" className="btn btn-coral">Go to practice tests</Link>
        </div>
      </>
    );
  }

  if (phase === "form" || phase === "waiting") {
    return (
      <>
        <h1 style={titleStyle}>Payment received — choose your password.</h1>
        <p style={pStyle}>
          Your payment is confirmed. Pick a password for your student login now — you&rsquo;ll use it with
          your student code or email next time you sign in.
        </p>
        <form onSubmit={submit} style={{ maxWidth: 360, marginTop: 18 }}>
          <label style={labelStyle} htmlFor="pw">Password</label>
          <input id="pw" type="password" value={pw} autoFocus autoComplete="new-password"
                 onChange={(e) => setPw(e.target.value)} style={inputStyle} disabled={busy} />
          <label style={labelStyle} htmlFor="pw2">Type it again</label>
          <input id="pw2" type="password" value={pw2} autoComplete="new-password"
                 onChange={(e) => setPw2(e.target.value)} style={inputStyle} disabled={busy} />
          {err && <div style={errStyle}>{err}</div>}
          <button className="btn btn-coral" type="submit" disabled={busy || pw.length < 6} style={{ marginTop: 14 }}>
            {phase === "waiting" ? "Setting up your account…" : "Save password & sign in"}
          </button>
        </form>
        <p style={{ fontSize: 13, color: "var(--grey)", marginTop: 14 }}>
          Prefer not to? We&rsquo;ll still email you a login within a few minutes.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 style={titleStyle}>Thank you — welcome to Pioneer Education.</h1>
      <p style={pStyle}>
        Your payment has gone through. Within a few minutes we email you your <b>student login</b> — a
        student code and a password — at the email address you gave Razorpay. Use it to sign in to the
        practice tests.
      </p>
      {err && <div style={errStyle}>{err}</div>}
      <ul style={{ lineHeight: 1.9, color: "var(--ink)", paddingLeft: 20, margin: "18px 0" }}>
        <li>No email after 15 minutes? Check the Spam or Promotions folder.</li>
        <li>Keep your Razorpay receipt — it has your payment ID.</li>
        <li>Lost your password later? Use &ldquo;Forgot password&rdquo; on the sign-in page.</li>
      </ul>
      <div className="hero-ctas" style={{ marginTop: 24 }}>
        <Link href="/practice/sign-in" className="btn btn-coral">Go to student sign in</Link>
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Message us on WhatsApp</a>
      </div>
    </>
  );
}
