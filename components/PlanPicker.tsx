"use client";

import { useState } from "react";
import type { Plan, Term } from "@/app/data/courses";

/* The fee cards for one course: pick 1 month or 3 months (and the level, for
 * German), then the three plans for that choice. Every price is still in the
 * page source, so nothing depends on a click to be found. */

const TERMS: { key: Term; label: string }[] = [
  { key: "1m", label: "1 month" },
  { key: "3m", label: "3 months" },
];

export default function PlanPicker({ plans, wa }: { plans: Plan[]; wa: string }) {
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
              {plan.payLink && plan.price !== null ? (
                <>
                  <a href={plan.payLink} target="_blank" rel="noopener noreferrer"
                     className={plan.featured ? "btn" : "btn btn-coral"}
                     style={plan.featured
                       ? { width: "100%", justifyContent: "center", background: "#fff", color: "var(--coral-dark)" }
                       : { width: "100%", justifyContent: "center" }}>
                    Pay now — secure Razorpay
                  </a>
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
    </>
  );
}
