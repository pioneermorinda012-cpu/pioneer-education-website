"use client";
import Link from "next/link";
import Chatbot from "../components/Chatbot";

const WA = "https://wa.me/917380261308?text=Hi!%20I%20want%20to%20know%20more%20about%20Pioneer%20Education";
const G = "#1a6b45";
const GOLD = "#c9a227";

const results = [
  { name: "Arsh", score: "8.5", module: "Listening", exam: "IELTS" },
  { name: "Harshdeep Kaur", score: "7.5", module: "Overall", exam: "IELTS" },
  { name: "Sukhman Kaur", score: "7.0", module: "Overall", exam: "IELTS" },
  { name: "Harpreet Singh", score: "9.0", module: "Listening", exam: "IELTS" },
  { name: "Rai Sandeep", score: "9.0", module: "Bands", exam: "IELTS" },
  { name: "Sunpreet Singh", score: "84", module: "Score", exam: "PTE" },
];

const reviews = [
  { name: "Harmeet Singh", stars: 5, text: "Narinder Dhiman is the best teacher I have ever seen. I achieved my band scores only because of him. Anyone who thinks they can't achieve bands in IELTS must visit here." },
  { name: "Ramneet Kang", stars: 5, text: "Pioneer Education is the best place to learn English. Staff is highly educated and polite. Visual presentations are very interesting. Sir also teaches life skills too." },
  { name: "Pavanpreet Kaur", stars: 5, text: "All teachers are highly qualified, very helpful and kind. I built my confidence and communication skills here. I learned important lessons and met inspiring teachers." },
  { name: "Harman Singh", stars: 5, text: "You can see the difference in first 2 to 3 classes. They give suggestions to take good bands in IELTS and provide personal attention to every student." },
];

const whyUs = [
  { icon: "⏰", title: "4–5 Hours Daily", desc: "Intensive classes from 9 AM to 1 PM with evening batches available" },
  { icon: "👤", title: "Individual Attention", desc: "Maximum 8 students per batch so every student gets personal focus" },
  { icon: "📊", title: "3 Level Material", desc: "Beginner, Intermediate & Advanced practice material designed for all levels" },
  { icon: "📝", title: "Weekly Mock Tests", desc: "Every Friday mock test + detailed feedback to track your progress" },
  { icon: "🖥️", title: "Visual Learning", desc: "Every Saturday — visual presentations and vocabulary increasing games" },
  { icon: "📱", title: "24/7 Support", desc: "Telegram channel + website + app support with daily sample answers" },
  { icon: "🌐", title: "Online & Offline", desc: "Live classes across India — join from anywhere with phone or laptop" },
  { icon: "🏆", title: "Proven Results", desc: "Students achieving 7.5+ bands in IELTS and 80+ in PTE consistently" },
];

const courses = [
  { icon: "📘", name: "IELTS Coaching", badge: "Most Enrolled", color: "#e8f4ed", desc: "Academic & General Training. Full preparation for Reading, Writing, Listening & Speaking with mock tests and personalized feedback.", includes: ["All 4 modules covered", "Weekly mock tests every Friday", "Detailed written feedback", "Expected writing topics"] },
  { icon: "💻", name: "PTE Coaching", badge: "", color: "#e8edf4", desc: "Complete PTE preparation covering all zones — Listening, Speaking, Reading and Writing with timed practice.", includes: ["All PTE task types", "Speaking zone practice", "Listening labs", "Exam filling guidance"] },
  { icon: "🗣️", name: "Spoken English", badge: "Popular", color: "#f4f0e8", desc: "From Beginner to Advanced. Grammar, vocabulary, pronunciation, and everyday conversation. Stop translating from Hindi!", includes: ["250+ vocabulary words", "850 phrases & idioms", "Visual presentations", "Everyday English"] },
  { icon: "🇩🇪", name: "German A1–B1", badge: "", color: "#f4e8e8", desc: "Full German language curriculum from scratch to B1 level including grammar, vocabulary, speaking and exam preparation.", includes: ["A1 to B1 levels", "Grammar & vocabulary", "Speaking practice", "Exam preparation"] },
];

export default function Home() {
  return (
    <main>
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.08)", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" style={{ height: 44, width: "auto", borderRadius: 8 }} alt="Pioneer Education" onError={(e: any) => { e.target.style.display='none'; }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: G }}>Pioneer Education</div>
            <div style={{ fontSize: 11, color: "#888" }}>Morinda & Kurali, Punjab</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#555" }}>
          <a href="#courses" style={{ textDecoration: "none", color: "#555" }}>Courses</a>
          <a href="#results" style={{ textDecoration: "none", color: "#555" }}>Results</a><a href="/writing-analyzer" style={{ textDecoration: "none", color: "#555" }}>Writing Analyzer</a>
          <a href="#reviews" style={{ textDecoration: "none", color: "#555" }}>Reviews</a>
          <a href="#contact" style={{ textDecoration: "none", color: "#555" }}>Contact</a>
    
        </div>
        <a href={WA} target="_blank" rel="noreferrer" style={{ background: G, color: "#fff", padding: "8px 18px", borderRadius: 24, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Free Demo →</a>
      </nav>

      {/* HERO */}
      <section style={{ background: "linear-gradient(135deg, #0a2e1a 0%, #1a6b45 60%, #2a8a5a 100%)", padding: "60px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(201,162,39,0.25)", border: "1px solid #c9a227", borderRadius: 24, padding: "6px 16px", fontSize: 12, color: GOLD, fontWeight: 600, marginBottom: 20 }}>
            🎓 Est. 2017 · 1000+ Students · Morinda & Kurali · Lic. No. 141
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 12 }}>
            Master Any Language.<br />
            <span style={{ color: GOLD }}>Open Every Door.</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginBottom: 8 }}>IELTS • PTE • Spoken English • German A1–B1</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 32 }}>Punjab's most trusted language institute — online & offline coaching</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={WA} target="_blank" rel="noreferrer" style={{ background: GOLD, color: "#1a1a1a", padding: "12px 28px", borderRadius: 32, fontWeight: 800, fontSize: 14, textDecoration: "none" }}>Book Free Demo Class</a>
            <a href="#courses" style={{ border: "2px solid #fff", color: "#fff", padding: "12px 28px", borderRadius: 32, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>View Courses ↓</a>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 32, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
            <span>⭐ 4.9 Google Rating</span>
            <span>👨‍🎓 1000+ Students</span>
            <span>🌐 Online Across India</span>
            <span>🏆 TEFL Certified Teacher</span>
          </div>
        </div>
      </section>

      {/* RESULTS BANNER */}
      <section id="results" style={{ background: GOLD, padding: "30px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", fontWeight: 800, fontSize: 15, color: "#1a1a1a", marginBottom: 20 }}>🏆 OUR RECENT RESULTS</div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            {results.map((r, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px 20px", textAlign: "center", minWidth: 120, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: G }}>{r.score}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#333" }}>{r.module}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{r.name}</div>
                <div style={{ fontSize: 10, background: G, color: "#fff", borderRadius: 8, padding: "2px 8px", marginTop: 4, display: "inline-block" }}>{r.exam}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section id="courses" style={{ padding: "60px 20px", background: "#f7f9fc" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, color: G, marginBottom: 8 }}>Our Courses</h2>
          <p style={{ textAlign: "center", color: "#888", fontSize: 14, marginBottom: 40 }}>Every course includes a free demo class — no payment needed</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {courses.map((c, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #eee", position: "relative" }}>
                {c.badge && <div style={{ position: "absolute", top: 12, right: 12, background: GOLD, color: "#1a1a1a", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10 }}>{c.badge}</div>}
                <div style={{ fontSize: 32, marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: G, marginBottom: 8 }}>{c.name}</div>
                <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 12 }}>{c.desc}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {c.includes.map((item, j) => (
                    <li key={j} style={{ fontSize: 11, color: "#555", padding: "3px 0", display: "flex", gap: 6 }}>
                      <span style={{ color: G }}>✓</span>{item}
                    </li>
                  ))}
                </ul>
                <a href={WA} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 16, background: G, color: "#fff", textAlign: "center", padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Book Free Demo</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section style={{ padding: "60px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, color: G, marginBottom: 8 }}>Why Pioneer Education?</h2>
          <p style={{ textAlign: "center", color: "#888", fontSize: 14, marginBottom: 40 }}>We deliver more than you ask for</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {whyUs.map((w, i) => (
              <div key={i} style={{ background: "#f7f9fc", borderRadius: 14, padding: 20, borderLeft: `4px solid ${G}` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{w.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: G, marginBottom: 4 }}>{w.title}</div>
                <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, margin: 0 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "60px 20px", background: "#f7f9fc" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, color: G, marginBottom: 8 }}>Simple, Honest Pricing</h2>
          <p style={{ textAlign: "center", color: "#888", fontSize: 14, marginBottom: 40 }}>First demo class always free · Sibling discount 20% · Refer & Earn ₹500</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {[
              { name: "Material Access", price: "₹499", period: "/month", features: ["Study material & resources", "Practice exercises & quizzes", "Self-paced learning"], highlight: false },
              { name: "Group Class", price: "₹2,499", period: "/month", features: ["Live classes 5 days/week", "Max 8 students per batch", "Online + Offline", "Weekly progress feedback", "Certificate on completion"], highlight: true, badge: "Most Popular" },
              { name: "1-to-1 Coaching", price: "₹4,999", period: "/month", features: ["Dedicated personal sessions", "Custom curriculum", "Flexible timings", "Interview prep", "Priority WhatsApp support"], highlight: false },
            ].map((p, i) => (
              <div key={i} style={{ borderRadius: 16, padding: 24, position: "relative", background: p.highlight ? G : "#fff", border: p.highlight ? "none" : "1px solid #e0e0e0", boxShadow: p.highlight ? "0 8px 30px rgba(26,107,69,0.3)" : "0 2px 8px rgba(0,0,0,0.05)" }}>
                {p.badge && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: GOLD, color: "#1a1a1a", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 12 }}>{p.badge}</div>}
                <div style={{ fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.7)" : "#888", marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: p.highlight ? "#fff" : G }}>{p.price}<span style={{ fontSize: 13, fontWeight: 400, color: p.highlight ? "rgba(255,255,255,0.6)" : "#aaa" }}>{p.period}</span></div>
                <ul style={{ listStyle: "none", padding: 0, margin: "16px 0" }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ fontSize: 12, color: p.highlight ? "rgba(255,255,255,0.85)" : "#555", padding: "4px 0", display: "flex", gap: 6 }}>
                      <span>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <a href={WA} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", background: p.highlight ? "#fff" : G, color: p.highlight ? G : "#fff" }}>Enroll Now</a>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 20, padding: 16, background: "#fff3cd", borderRadius: 12, border: "1px solid #ffc107" }}>
            <strong>📞 IELTS, PTE & German fees</strong> — Contact us on WhatsApp for custom pricing based on your requirement and batch type.
            <br /><a href={WA} target="_blank" rel="noreferrer" style={{ color: G, fontWeight: 700 }}>WhatsApp: +91 73802 61308</a>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" style={{ padding: "60px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, color: G, marginBottom: 8 }}>What Students Say</h2>
          <p style={{ textAlign: "center", color: "#888", fontSize: 14, marginBottom: 40 }}>4.9 ⭐ rated on Google Maps</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {reviews.map((r, i) => (
              <div key={i} style={{ background: "#f7f9fc", borderRadius: 14, padding: 20, border: "1px solid #eee" }}>
                <div style={{ color: GOLD, fontSize: 14, marginBottom: 8 }}>{"⭐".repeat(r.stars)}</div>
                <p style={{ fontSize: 12, color: "#444", lineHeight: 1.7, marginBottom: 12 }}>"{r.text}"</p>
                <div style={{ fontWeight: 700, fontSize: 12, color: G }}>— {r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHATBOT */}
      <section id="chat" style={{ padding: "60px 20px", background: "#f7f9fc" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: G, marginBottom: 8 }}>Have Questions?</h2>
          <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>Our AI assistant answers instantly — or WhatsApp us directly</p>
          <Chatbot />
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: "60px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, color: G, marginBottom: 40 }}>Find Us</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            <div style={{ background: "#f7f9fc", borderRadius: 16, padding: 24, borderLeft: `4px solid ${G}` }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: G, marginBottom: 12 }}>📍 Morinda Branch</div>
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.8 }}>1st Floor Kalsi Cafe,<br />Opp. Khalsa Girls College,<br />Morinda 140101, Punjab</p>
              <a href="tel:+917589210921" style={{ color: G, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>📞 +91 75892-10921</a>
            </div>
            <div style={{ background: "#f7f9fc", borderRadius: 16, padding: 24, borderLeft: `4px solid ${GOLD}` }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: G, marginBottom: 12 }}>📍 Kurali Branch</div>
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.8 }}>Ward No. 6, Near Veer Ji Spare Parts,<br />Siswan Road, Kurali,<br />Punjab</p>
              <a href="tel:+919855991214" style={{ color: G, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>📞 +91 98559-91214</a>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <a href={WA} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", padding: "12px 28px", borderRadius: 32, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              💬 WhatsApp Us · +91 73802 61308
            </a>
            <div style={{ marginTop: 16, fontSize: 13, color: "#888" }}>
              All social media: <a href="https://linktr.ee/PioneerEducationCenter" target="_blank" rel="noreferrer" style={{ color: G, fontWeight: 600 }}>linktr.ee/PioneerEducationCenter</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0a2e1a", padding: "30px 20px", textAlign: "center" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Pioneer Education</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8 }}>We Deliver More Than You Ask For · Lic. No. 141/DM Rupnagar</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>© 2025 Pioneer Education. Morinda & Kurali, Punjab.</div>
      </footer>

      <Chatbot />
    </main>
  );
}