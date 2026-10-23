"use client";

import { useState } from "react";
import type { Plan, Term } from "@/app/data/courses";

const buyable = (p: Plan) => typeof p.price === "number" && p.price > 0 && !p.comingSoon;

/* The fee cards for one course: pick 1 month or 3 months (and the level, for
 * German), then the three plans for that choice. Every price is still in the
 * page source, so nothing depends on a click to be found. */

const TERMS: { key: Term; label: string }[] = [
  { key: "1m", label: "1 month" },
  { key: "3m", label: "3 months" },
];

export default function PlanPicker({ plans, wa, course, courseName, canPay }: {
  plans: Plan[]; wa: string; course: string; courseName: string; canPay: boolean;
}) {
  const [buying, setBuying] = useState<Plan | null>(null);
  const levels = [...new Set(plans.map((p) => p.level).filter((l): l is string => Boolean(l)))];
  const [level, setLevel] = useState(levels[0]);
  const [term, setTerm] = useState<Term>("1m");

  const ofLevel = plans.filter((p) => !levels.length || p.level === level);
  const shown = ofLevel.filter((p) => p.term === term);
  const monthly = (p: Plan) =>
    ofLevel.find((m) => m.term === "1m" && m.tier === p.tier)?.price ?? null;

  return (
    <>
      <div className="plan-switch">
        {levels.length > 0 && (
          <div className="plan-tabs" role="tablist" aria-label="Level">
            {levels.map((l) => (
              <button key={l} type="button" role="tab" aria-selected={l === level}
                      className={l === level ? "on" : undefined} onClick={() => setLevel(l)}>
                {l}
              </button>
            ))}
          </div>
        )}
        <div className="plan-tabs" role="tablist" aria-label="Subscription length">
          {TERMS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={t.key === term}
                    className={t.key === term ? "on" : undefined} onClick={() => setTerm(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pricing-grid">
        {shown.map((plan) => {
          const light = plan.featured ? { color: "rgba(255,255,255,0.9)" } : undefined;
          const m = monthly(plan);
          // what three single months would cost, so the saving is visible
          const save = term === "3m" && plan.price && m ? Math.round((1 - plan.price / (m * 3)) * 100) : 0;
          return (
            <div key={`${plan.level}-${plan.tier}-${plan.term}`} className={plan.featured ? "price-card featured" : "price-card"}>
              {plan.featured && <div className="pc-badge">Most Popular</div>}
              <div className="pc-name" style={plan.featured ? { color: "rgba(255,255,255,0.8)" } : undefined}>
                {plan.level ? `${plan.level} · ` : ""}{plan.name}
              </div>
              <div className="pc-price" style={plan.featured ? { color: "#fff" } : undefined}>
                {plan.price === null ? (
                  <span style={{ fontSize: "1.1rem", color: plan.featured ? "rgba(255,255,255,0.85)" : "var(--grey)" }}>{plan.comingSoon ? "Coming soon" : "Fee on request"}</span>
                ) : (
                  <>
                    ₹{plan.price.toLocaleString("en-IN")}
                    <span style={plan.featured ? { color: "rgba(255,255,255,0.7)" } : undefined}>{plan.period}</span>
                  </>
                )}
              </div>
              {save > 0 && plan.price && (
                <div className="pc-save" style={plan.featured ? { color: "#fff" } : undefined}>
                  ₹{Math.round(plan.price / 3).toLocaleString("en-IN")}/month · save {save}%
                </div>
              )}
              <ul className="course-feats" style={light}>
                {plan.feats.map((f, j) => (
                  <li key={j} style={light}>{f}</li>
                ))}
              </ul>
              {canPay && buyable(plan) ? (
                <>
                  <button type="button" onClick={() => setBuying(plan)}
                     className={plan.featured ? "btn" : "btn btn-coral"}
                     style={plan.featured
                       ? { width: "100%", justifyContent: "center", background: "#fff", color: "var(--coral-dark)" }
                       : { width: "100%", justifyContent: "center" }}>
                    Pay now — secure Razorpay
                  </button>
                  <a href={wa} target="_blank" rel="noopener noreferrer"
                     style={{ display: "block", textAlign: "center", marginTop: 10, fontSize: "0.85rem", fontWeight: 600,
                       color: plan.featured ? "rgba(255,255,255,0.85)" : "var(--grey)" }}>
                    Questions first? Ask on WhatsApp
                  </a>
                </>
              ) : (
                <a href={wa} target="_blank" rel="noopener noreferrer"
                   className={plan.featured ? "btn" : "btn btn-outline"}
                   style={plan.featured
                     ? { width: "100%", justifyContent: "center", background: "#fff", color: "var(--coral-dark)" }
                     : { width: "100%", justifyContent: "center" }}>
                  {plan.comingSoon ? "Ask to be told when it starts" : "Ask on WhatsApp"}
                </a>
              )}
            </div>
          );
        })}
      </div>
      {buying && (
        <BuyForm plan={buying} course={course} courseName={courseName} onClose={() => setBuying(null)} />
      )}
    </>
  );
}

/* The buyer's details, then off to Razorpay. The login is emailed to this
   address, so it is asked for here rather than left to the payment page. */
function BuyForm({ plan, course, courseName, onClose }: {
  plan: Plan; course: string; courseName: string; onClose: () => void;
}) {
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (f.name.trim().length < 2) return setErr("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) return setErr("Enter a valid email address — your login is sent there.");
    const digits = f.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(digits)) return setErr("Enter a 10-digit mobile number.");
    setBusy(true);
    try {
      const res = await fetch("/api/pay/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course, tier: plan.tier, term: plan.term, level: plan.level ?? "",
          name: f.name, email: f.email, phone: digits,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.url) { setErr(d.error || "Could not open the payment page. Please try again."); setBusy(false); return; }
      window.location.href = d.url;
    } catch {
      setErr("No connection. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="buy-ov" role="dialog" aria-modal="true" aria-label="Your details" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <form className="buy-box" onSubmit={go}>
        <button type="button" className="buy-x" aria-label="Close" onClick={onClose} disabled={busy}>×</button>
        <div className="buy-what">{courseName}</div>
        <div className="buy-plan">{[plan.level, plan.name].filter(Boolean).join(" · ")}</div>
        <div className="buy-price">
          ₹{plan.price!.toLocaleString("en-IN")} <span>{plan.term === "1m" ? "for 1 month" : "for 3 months"}</span>
        </div>
        <label htmlFor="b-name">Full name</label>
        <input id="b-name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <label htmlFor="b-email">Email — your login is sent here</label>
        <input id="b-email" type="email" autoComplete="email" inputMode="email" value={f.email}
               onChange={(e) => setF({ ...f, email: e.target.value })} />
        <label htmlFor="b-phone">Mobile number</label>
        <input id="b-phone" type="tel" autoComplete="tel" inputMode="numeric" placeholder="98765 43210" value={f.phone}
               onChange={(e) => setF({ ...f, phone: e.target.value })} />
        {err && <div className="buy-err">{err}</div>}
        <button className="btn btn-coral" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
          {busy ? "Opening Razorpay…" : `Continue to pay ₹${plan.price!.toLocaleString("en-IN")}`}
        </button>
        <p className="buy-small">
          You pay on Razorpay&apos;s secure page (UPI, cards, net banking). Your student login is emailed as soon as
          the payment goes through. Already a student? Use the same email and the time is added to your login.
        </p>
      </form>
    </div>
  );
}
