"use client";
import Chatbot from "../components/Chatbot";

const WA = "https://wa.me/917380261308?text=Hi!%20I%20want%20to%20know%20more%20about%20Pioneer%20Education";

const courses = [
  { icon: "📘", name: "IELTS Coaching", desc: "Full band preparation — Reading, Writing, Listening & Speaking. Mock tests + personalized feedback.", badge: "Most Enrolled" },
  { icon: "💻", name: "PTE Coaching", desc: "AI-scored test strategies, timed mock tests, and speaking fluency training.", badge: "" },
  { icon: "🗣️", name: "Spoken English", desc: "From Beginner to Advanced. Stop translating from Hindi — think and speak in English.", badge: "Popular" },
  { icon: "🇩🇪", name: "German A1–B1", desc: "Grammar, vocabulary, speaking & exam prep. Full curriculum from scratch to B1 level.", badge: "" },
];

const plans = [
  { name: "Material Access", price: "₹499", period: "/month", features: ["Study material & resources", "Practice exercises & quizzes", "Self-paced learning"], highlight: false },
  { name: "Group Class", price: "₹2,499", period: "/month", features: ["Live classes 5 days/week", "Max 8 students per batch", "Online + Offline (Morinda)", "Weekly progress feedback", "Certificate on completion"], highlight: true, badge: "Most Popular" },
  { name: "1-to-1 Coaching", price: "₹4,999", period: "/month", features: ["Dedicated personal sessions", "Custom curriculum", "Flexible timings", "Interview prep included", "Priority WhatsApp support"], highlight: false },
];

export default function Home() {
  return (
    <main>
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Replace below div with <img src="/logo.png" className="h-10" /> once you add logo */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: "var(--green)" }}>P</div>
            <div>
              <div className="font-bold text-sm leading-tight" style={{ color: "var(--green)" }}>Pioneer Education</div>
              <div className="text-xs text-gray-400">Morinda, Punjab</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#courses" className="hover:text-green-700">Courses</a>
            <a href="#pricing" className="hover:text-green-700">Fees</a>
            <a href="#chat" className="hover:text-green-700">Ask Us</a>
          </div>
          <a href={WA} target="_blank" rel="noreferrer"
            className="text-sm font-semibold text-white px-4 py-2 rounded-full"
            style={{ background: "var(--green)" }}>
            Free Demo →
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-16 px-4 text-center" style={{ background: "linear-gradient(135deg, #0f3d25 0%, #1a6b45 60%, #2a8a5a 100%)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-5 text-white" style={{ background: "rgba(201,162,39,0.3)", border: "1px solid var(--gold)" }}>
            🎓 Est. 2017 · 500+ Students Trained · Morinda, Punjab
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Master Any Language.<br />
            <span style={{ color: "var(--gold)" }}>Open Every Door.</span>
          </h1>
          <p className="text-green-100 text-base md:text-lg mb-8 max-w-xl mx-auto">
            IELTS • PTE • Spoken English • German A1–B1<br />
            Online & offline coaching from Morinda's most trusted institute.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WA} target="_blank" rel="noreferrer"
              className="font-bold px-6 py-3 rounded-full text-sm"
              style={{ background: "var(--gold)", color: "#1a1a1a" }}>
              Book Free Demo Class
            </a>
            <a href="#chat"
              className="font-semibold px-6 py-3 rounded-full text-sm border border-white text-white hover:bg-white hover:text-green-800 transition">
              Ask Our Assistant ↓
            </a>
          </div>
          <div className="flex justify-center gap-6 mt-10 text-green-100 text-sm">
            <div>⭐ 4.9 Rated</div>
            <div>👨‍🎓 500+ Students</div>
            <div>🌐 Online Across India</div>
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section id="courses" className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "var(--green)" }}>Our Courses</h2>
          <p className="text-center text-gray-500 text-sm mb-10">Choose your path — every course includes a free demo class</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {courses.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition relative">
                {c.badge && (
                  <div className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--gold)", color: "#1a1a1a" }}>{c.badge}</div>
                )}
                <div className="text-3xl mb-3">{c.icon}</div>
                <div className="font-bold text-sm mb-2" style={{ color: "var(--green)" }}>{c.name}</div>
                <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "var(--green)" }}>Simple, Honest Pricing</h2>
          <p className="text-center text-gray-500 text-sm mb-10">First demo class is always free — no payment, no obligation</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <div key={i} className={`rounded-2xl p-6 border ${p.highlight ? "shadow-lg" : "border-gray-200"} relative`}
                style={p.highlight ? { background: "var(--green)", color: "white", border: "none" } : {}}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full text-white"
                    style={{ background: "var(--gold)", color: "#1a1a1a" }}>{p.badge}</div>
                )}
                <div className={`text-sm font-semibold mb-1 ${p.highlight ? "text-green-200" : "text-gray-400"}`}>{p.name}</div>
                <div className={`text-3xl font-extrabold mb-1 ${p.highlight ? "text-white" : ""}`} style={!p.highlight ? { color: "var(--green)" } : {}}>
                  {p.price}<span className={`text-sm font-normal ${p.highlight ? "text-green-200" : "text-gray-400"}`}>{p.period}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f, j) => (
                    <li key={j} className={`text-xs flex items-start gap-2 ${p.highlight ? "text-green-100" : "text-gray-600"}`}>
                      <span className="mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <a href={WA} target="_blank" rel="noreferrer"
                  className={`mt-5 block text-center text-sm font-bold py-2.5 rounded-full ${p.highlight ? "bg-white" : "text-white"}`}
                  style={p.highlight ? { color: "var(--green)" } : { background: "var(--green)" }}>
                  Enroll Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHATBOT */}
      <section id="chat" className="py-14 px-4 bg-gray-50">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "var(--green)" }}>Have Questions?</h2>
          <p className="text-center text-gray-500 text-sm mb-8">Our assistant answers instantly — or WhatsApp us for anything else</p>
          <Chatbot />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 text-center text-sm text-gray-500" style={{ background: "#0f3d25", color: "#a0c4a0" }}>
        <div className="font-bold text-white mb-1">Pioneer Education</div>
        <div>Prem Nagar, Morinda, Punjab — Opposite Khalsa Girls College</div>
        <div className="mt-2">
          <a href={WA} target="_blank" rel="noreferrer" className="text-green-300 hover:text-white">WhatsApp: +91 73802 61308</a>
        </div>
        <div className="mt-3 text-xs text-green-900">© 2025 Pioneer Education. All rights reserved.</div>
      </footer>
    </main>
  );
}