"use client";

import { useRef, useState } from "react";
import SiteNav from "../../components/SiteNav";
import { COURSES } from "../data/courses";

// A fresh Google Sheet + Apps Script, separate from the homepage/chatbot
// lead-capture sheet, so a wrong field here can never break that one.
// See claude/admission-form-setup.md for the exact Apps Script code and the
// steps to get this URL — paste it in once the sheet is set up.
const SHEET_URL = "https://script.google.com/macros/s/AKfycbyCsbI0ci_TJEitjK9wNNXlmDe4Eii-4jMHqq94T4CnGYrQSPVO7e9worcsSFl9SWn1OA/exec";

const HEARD_FROM = ["Walk-in / Just passing by", "Instagram", "Facebook", "WhatsApp", "Friend or family referral", "Google Search", "Other"];
const TIMINGS = ["Morning", "Afternoon", "Evening", "No preference"];
const PLANS = ["Online Self-Study", "Group Class", "1-to-1 Coaching", "Not decided yet"];

export default function AdmissionPage() {
  const nameRef = useRef<HTMLInputElement>(null);
  const guardianRef = useRef<HTMLInputElement>(null);
  const dobRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLSelectElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const courseRef = useRef<HTMLSelectElement>(null);
  const planRef = useRef<HTMLSelectElement>(null);
  const timingRef = useRef<HTMLSelectElement>(null);
  const qualificationRef = useRef<HTMLInputElement>(null);
  const heardRef = useRef<HTMLSelectElement>(null);
  const agreeRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ name: string; course: string } | null>(null);
  const [error, setError] = useState("");

  async function submitAdmission() {
    const name = nameRef.current?.value.trim() || "";
    const guardian = guardianRef.current?.value.trim() || "";
    const dob = dobRef.current?.value || "";
    const gender = genderRef.current?.value || "";
    const phone = phoneRef.current?.value.trim() || "";
    const email = emailRef.current?.value.trim() || "";
    const address = addressRef.current?.value.trim() || "";
    const course = courseRef.current?.value || "";
    const plan = planRef.current?.value || "";
    const timing = timingRef.current?.value || "";
    const qualification = qualificationRef.current?.value.trim() || "";
    const heardFrom = heardRef.current?.value || "";
    const agreed = agreeRef.current?.checked || false;

    setError("");
    if (!name) return setError("Please enter the student's full name.");
    if (!/^[6-9]\d{9}$/.test(phone)) return setError("Please enter a valid 10-digit mobile number.");
    if (!course) return setError("Please choose the course being joined.");
    if (!agreed) return setError("Please tick the confirmation box at the bottom before submitting.");

    setSubmitting(true);
    try {
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "Admission Form",
          submittedAt: new Date().toISOString(),
          name, guardian, dob, gender, phone, email, address,
          course, plan, timing, qualification, heardFrom,
        }),
      });
    } catch (e) {
      console.log("Admission sheet save error:", e);
    }
    setSubmitting(false);
    setSubmitted({ name, course });
  }

  const wa = "https://wa.me/917380261308?text=" + encodeURIComponent("Hi Pioneer Education, I just filled the admission form.");

  return (
    <>
      <SiteNav ctaHref={wa} />

      <section style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <div className="eyebrow">Admission Form</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "2.4rem", fontWeight: 600, color: "var(--navy)", lineHeight: 1.15, marginBottom: "14px" }}>
            Join Pioneer Education
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--grey)", maxWidth: "640px" }}>
            Fill this in once you&apos;ve decided to join — it takes about two minutes. Our team will confirm your batch
            and fee plan over a call or WhatsApp right after.
          </p>
        </div>
      </section>

      <section>
        <div className="wrap" style={{ maxWidth: 720 }}>
          {submitted ? (
            <div
              style={{
                background: "var(--paper)", border: "1.5px solid rgba(17,17,17,0.08)", borderRadius: 24,
                padding: "48px 36px", textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2.4rem", marginBottom: 10 }}>✅</div>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "1.6rem", color: "var(--navy)", marginBottom: 10 }}>
                Thank you, {submitted.name}!
              </h2>
              <p style={{ color: "var(--grey)", marginBottom: 22 }}>
                We&apos;ve received your admission form for <b>{submitted.course}</b>. Our team will reach out shortly to
                confirm your batch and fee details.
              </p>
              <a href={wa} target="_blank" rel="noreferrer" className="btn btn-coral" style={{ display: "inline-flex" }}>
                Message us on WhatsApp now
              </a>
            </div>
          ) : (
            <div
              className="lead-form"
              style={{
                background: "var(--paper)", border: "1.5px solid rgba(17,17,17,0.08)", borderRadius: 24,
                padding: "36px",
              }}
            >
              <div>
                <label htmlFor="adm-name">Student&apos;s Full Name *</label>
                <input type="text" id="adm-name" ref={nameRef} placeholder="e.g. Gurpreet Singh" required />
              </div>

              <div>
                <label htmlFor="adm-guardian">Father&apos;s / Guardian&apos;s Name</label>
                <input type="text" id="adm-guardian" ref={guardianRef} placeholder="e.g. Harjeet Singh" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label htmlFor="adm-dob">Date of Birth</label>
                  <input type="date" id="adm-dob" ref={dobRef} />
                </div>
                <div>
                  <label htmlFor="adm-gender">Gender</label>
                  <select id="adm-gender" ref={genderRef} defaultValue="">
                    <option value="">Prefer not to say</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label htmlFor="adm-phone">Mobile Number *</label>
                  <input type="tel" id="adm-phone" ref={phoneRef} placeholder="10-digit mobile number" required />
                </div>
                <div>
                  <label htmlFor="adm-email">Email Address</label>
                  <input type="email" id="adm-email" ref={emailRef} placeholder="optional" />
                </div>
              </div>

              <div>
                <label htmlFor="adm-address">Full Address</label>
                <textarea
                  id="adm-address" ref={addressRef} rows={2} placeholder="House no., street, village/city"
                  style={{ width: "100%", padding: "13px 15px", border: "1.5px solid var(--grey-light)", borderRadius: 12, fontSize: "0.95rem", fontFamily: "'Inter',sans-serif", color: "var(--ink)", background: "#fff", resize: "vertical" }}
                />
              </div>

              <div>
                <label htmlFor="adm-course">Course Joining *</label>
                <select id="adm-course" ref={courseRef} defaultValue="" required>
                  <option value="">Select a course</option>
                  {COURSES.map((c) => (
                    <option key={c.slug} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label htmlFor="adm-plan">Plan</label>
                  <select id="adm-plan" ref={planRef} defaultValue="">
                    <option value="">Select a plan</option>
                    {PLANS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="adm-timing">Preferred Batch Timing</label>
                  <select id="adm-timing" ref={timingRef} defaultValue="">
                    <option value="">Select timing</option>
                    {TIMINGS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label htmlFor="adm-qualification">Highest Qualification</label>
                  <input type="text" id="adm-qualification" ref={qualificationRef} placeholder="e.g. B.A., 12th" />
                </div>
                <div>
                  <label htmlFor="adm-heard">How did you hear about us?</label>
                  <select id="adm-heard" ref={heardRef} defaultValue="">
                    <option value="">Select one</option>
                    {HEARD_FROM.map((h) => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, textTransform: "none", fontWeight: 400, color: "var(--ink)", fontSize: "0.9rem", marginTop: 4 }}>
                <input type="checkbox" ref={agreeRef} style={{ width: "auto", marginTop: 3 }} />
                I confirm the details above are correct and I agree to the course and fee terms discussed with Pioneer Education.
              </label>

              {error && <div style={{ color: "#c0392b", fontSize: "0.9rem", fontWeight: 600 }}>{error}</div>}

              <button
                type="button" className="btn btn-coral"
                style={{ width: "100%", justifyContent: "center", marginTop: 6, opacity: submitting ? 0.6 : 1 }}
                onClick={submitAdmission} disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Admission Form"}
              </button>
              <div className="lead-note">We&apos;ll contact you on this number to confirm your admission.</div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
