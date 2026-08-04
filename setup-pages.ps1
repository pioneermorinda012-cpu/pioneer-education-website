# Pioneer Education website — auto-setup script
# This creates every folder and file correctly, with the exact content
# baked in — no copy-pasting needed, which is what kept going wrong.
#
# HOW TO RUN:
# 1. Open PowerShell
# 2. cd into your project folder, e.g.:
#      cd C:\Users\Dell\pioneer-website-real
# 3. Run this script:
#      .\setup-pages.ps1
#
# If PowerShell blocks it with a security message, run this first:
#      Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

Write-Host "Creating folders..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "app\about" | Out-Null
New-Item -ItemType Directory -Force -Path "app\courses\[slug]" | Out-Null
New-Item -ItemType Directory -Force -Path "app\data" | Out-Null
New-Item -ItemType Directory -Force -Path "public\images" | Out-Null

Write-Host "Writing files..." -ForegroundColor Cyan
$content = @'
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Pioneer Education — Morinda, Punjab",
  description:
    "Pioneer Education Center was founded in 2017 by Narinder Singh in Prem Nagar, Morinda. TEFL-certified, 5.0★ rated, 125+ reviews. IELTS, PTE, Spoken English & German coaching.",
};

export default function AboutPage() {
  const wa = "https://wa.me/917380261308?text=" + encodeURIComponent("Hi Pioneer Education, I'd like to know more about your institute.");

  return (
    <>
      <nav>
        <div className="nav-inner">
          <Link href="/" className="logo"><div className="logo-mark">P</div>Pioneer Education</Link>
          <div className="nav-links">
            <Link href="/#courses">Courses</Link>
            <Link href="/#results">Results</Link>
            <Link href="/#reviews">Reviews</Link>
            <Link href="/#contact">Contact</Link>
          </div>
          <div className="nav-cta">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-coral">Book Free Demo</a>
          </div>
        </div>
      </nav>

      <section style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <div className="eyebrow">Prem Nagar, Morinda · Since 2017</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "2.6rem", fontWeight: 600, color: "var(--navy)", lineHeight: 1.15, marginBottom: "18px" }}>
            Nine years of watching exactly where students lose marks.
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--grey)", maxWidth: "640px" }}>
            Pioneer Education Center opened in Prem Nagar, Morinda in 2017. What started as one instructor teaching IELTS
            has grown into a full teaching team covering IELTS, PTE, Spoken English, and German — while keeping the same
            batch sizes and personal attention that built our reputation in the first place.
          </p>
        </div>
      </section>

      <section>
        <div className="wrap instructor">
          <div>
            <img
              src="/images/instructor.jpg"
              alt="Narinder Singh, founder of Pioneer Education Center, Morinda"
              style={{ width: "100%", borderRadius: "22px", display: "block" }}
            />
          </div>
          <div>
            <div className="role">Founder</div>
            <div className="name">Narinder Singh</div>
            <blockquote>
              &quot;Every mistake a student makes has been made by someone before them. My job is to make sure you don&apos;t
              repeat it.&quot;
            </blockquote>
            <p className="bio">
              Narinder Singh founded Pioneer Education in 2017 as a TEFL-certified instructor, building a teaching
              approach rooted in pattern recognition — identifying exactly where each student&apos;s English breaks down,
              and fixing that specific gap rather than teaching generically. Today he leads a team of instructors
              delivering the same method across all four courses.
            </p>
            <div className="cred-row">
              <div className="cred"><div className="cred-icon">🎓</div><span>TEFL Certified</span></div>
              <div className="cred"><div className="cred-icon">⭐</div><span>5.0★ Google Rating</span></div>
              <div className="cred"><div className="cred-icon">📍</div><span>Prem Nagar, Morinda</span></div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head">
            <div className="section-eyebrow">How We're Different</div>
            <h2>Not a generic curriculum — a diagnosis-first approach.</h2>
            <p>
              Most institutes teach a fixed syllabus regardless of who's in the room. We've spent nearly a decade
              cataloguing the specific mistakes Punjabi-speaking students make in English and German, and built that
              directly into our lessons, our app, and our feedback style.
            </p>
          </div>
          <div className="facts-grid">
            <div className="fact-card">
              <h4>⏰ 4–5 hours daily</h4>
              <p>Intensive classes from 9 AM to 1 PM, with evening batches for working students.</p>
            </div>
            <div className="fact-card">
              <h4>👤 Max 8 per batch</h4>
              <p>Small batches by design, so every student gets real speaking time and attention.</p>
            </div>
            <div className="fact-card">
              <h4>📊 3-level material</h4>
              <p>Beginner, Intermediate, and Advanced — you start where you actually are, not where a syllabus assumes.</p>
            </div>
            <div className="fact-card">
              <h4>📝 Weekly mock tests</h4>
              <p>Every Friday, with detailed written feedback so progress is tracked, not just assumed.</p>
            </div>
            <div className="fact-card">
              <h4>💬 Daily app practice</h4>
              <p>The Lexio app extends every class into daily vocabulary, grammar, and pronunciation practice.</p>
            </div>
            <div className="fact-card">
              <h4>🇩🇪 Beyond English</h4>
              <p>The same structured, pattern-based method applied to German A1–B1 for visa and study applicants.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="final-cta">
            <h2>Come see it for yourself.</h2>
            <p>Book a free demo class in Prem Nagar, Morinda — no payment, no commitment.</p>
            <div className="btns">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-coral">Message Us on WhatsApp</a>
              <Link href="/#demo" className="btn" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)" }}>Book Free Demo</Link>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap footer-bottom">
          <div>© 2026 Pioneer Education Center. All rights reserved.</div>
          <Link href="/" style={{ color: "var(--coral)", fontWeight: 700 }}>← Back to homepage</Link>
        </div>
      </footer>
    </>
  );
}

'@
Set-Content -Path "app\about\page.tsx" -Value $content -Encoding UTF8
Write-Host "  Wrote app\about\page.tsx"
$content = @'
import { COURSES, getCourse } from "../../data/courses";
import Link from "next/link";
import type { Metadata } from "next";

export function generateStaticParams() {
  return COURSES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const course = getCourse(params.slug);
  if (!course) return { title: "Course Not Found — Pioneer Education" };
  return {
    title: `${course.name} — Pioneer Education, Morinda`,
    description: course.tagline + " " + course.description.slice(0, 120) + "...",
  };
}

export default function CoursePage({ params }: { params: { slug: string } }) {
  const course = getCourse(params.slug);

  if (!course) {
    return (
      <main style={{ padding: "80px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "2rem", color: "var(--navy)" }}>Course not found</h1>
        <p style={{ color: "var(--grey)", marginTop: "12px" }}>
          <Link href="/" style={{ color: "var(--coral)", fontWeight: 700 }}>← Back to homepage</Link>
        </p>
      </main>
    );
  }

  const wa = `https://wa.me/917380261308?text=${encodeURIComponent(
    `Hi Pioneer Education, I'd like to know more about ${course.name}.`
  )}`;

  return (
    <>
      <nav>
        <div className="nav-inner">
          <Link href="/" className="logo"><div className="logo-mark">P</div>Pioneer Education</Link>
          <div className="nav-links">
            <Link href="/#courses">Courses</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/#reviews">Reviews</Link>
            <Link href="/#contact">Contact</Link>
          </div>
          <div className="nav-cta">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-coral">Book Free Demo</a>
          </div>
        </div>
      </nav>

      <section style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Link href="/#courses" style={{ color: "var(--coral)", fontWeight: 700, fontSize: "0.85rem" }}>← All Courses</Link>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px", marginBottom: "12px" }}>
            <div style={{ fontSize: "2.4rem" }}>{course.icon}</div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "2.3rem", fontWeight: 600, color: "var(--navy)" }}>{course.name}</h1>
          </div>
          <p style={{ fontSize: "1.1rem", color: "var(--grey)", maxWidth: "620px", marginBottom: "24px" }}>{course.tagline}</p>
          <div className="hero-ctas" style={{ marginBottom: "32px" }}>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-coral">Book a Free Demo Class</a>
            <Link href="/#pricing" className="btn btn-outline">See Pricing</Link>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <p style={{ fontSize: "1.02rem", color: "var(--ink)", lineHeight: 1.75, maxWidth: "760px" }}>{course.description}</p>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head">
            <div className="section-eyebrow">What's Covered</div>
            <h2>The curriculum, module by module.</h2>
          </div>
          <div className="facts-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {course.modules.map((m, i) => (
              <div key={i} className="fact-card">
                <h4>{m.title}</h4>
                <p>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
          <div>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "1.3rem", color: "var(--navy)", marginBottom: "16px" }}>Who this is for</h3>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {course.forWhom.map((f, i) => (
                <li key={i} style={{ fontSize: "0.95rem", color: "var(--ink)", display: "flex", gap: "10px" }}>
                  <span style={{ color: "var(--coral)", fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "1.3rem", color: "var(--navy)", marginBottom: "16px" }}>Duration</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--ink)" }}>{course.duration}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <div className="section-eyebrow">Common Questions</div>
            <h2>{course.name} FAQ</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "760px" }}>
            {course.faqs.map((f, i) => (
              <div key={i} style={{ background: "var(--paper)", border: "1px solid rgba(17,17,17,0.08)", borderRadius: "14px", padding: "20px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.98rem", color: "var(--navy)", marginBottom: "8px" }}>{f.q}</div>
                <div style={{ fontSize: "0.92rem", color: "var(--grey)", lineHeight: 1.6 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="final-cta">
            <h2>Ready to start {course.name}?</h2>
            <p>Book a free demo class — no payment, no commitment.</p>
            <div className="btns">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-coral">Message Us on WhatsApp</a>
              <Link href="/#demo" className="btn" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)" }}>Book Free Demo</Link>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap footer-bottom">
          <div>© 2026 Pioneer Education Center. All rights reserved.</div>
          <Link href="/" style={{ color: "var(--coral)", fontWeight: 700 }}>← Back to homepage</Link>
        </div>
      </footer>
    </>
  );
}

'@
Set-Content -Path "app\courses\[slug]\page.tsx" -Value $content -Encoding UTF8
Write-Host "  Wrote app\courses\[slug]\page.tsx"
$content = @'
export type Course = {
  slug: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  modules: { title: string; desc: string }[];
  forWhom: string[];
  duration: string;
  faqs: { q: string; a: string }[];
};

export const COURSES: Course[] = [
  {
    slug: "ielts",
    name: "IELTS Coaching",
    icon: "✈️",
    tagline: "Academic & General Training — full preparation for all four modules.",
    description:
      "Our IELTS course covers Listening, Reading, Writing, and Speaking with real mock tests, banded feedback, and a curriculum built around nine years of watching exactly where Punjabi students lose marks. Both Academic and General Training tracks are covered, with content tailored to whether you're headed for university admission or migration.",
    modules: [
      { title: "Listening", desc: "Note completion, multiple choice, map labelling, and matching — all four question types with real recorded practice tests." },
      { title: "Reading", desc: "Skimming, scanning, True/False/Not Given, matching headings, and summary completion, drilled with timed passages." },
      { title: "Writing", desc: "Task 1 (graphs, letters) and Task 2 (essays) with structure templates and Band 7+ vocabulary in context." },
      { title: "Speaking", desc: "All 3 parts practiced live with instructors, including cue card strategy and fluency coaching." },
    ],
    forWhom: [
      "Students applying to universities abroad (Academic)",
      "Those pursuing PR or work visas (General Training)",
      "Anyone needing a specific band score for immigration",
    ],
    duration: "4–5 hours daily, weekday batches with evening options",
    faqs: [
      { q: "How long does the course take?", a: "Most students prepare in 6–10 weeks depending on their starting level and target band." },
      { q: "Do you cover both Academic and General Training?", a: "Yes — the core skills overlap, and we tailor Reading and Writing Task 1 practice to whichever version you're taking." },
      { q: "How often are mock tests?", a: "Every Friday, with detailed written feedback so you can track real progress week to week." },
    ],
  },
  {
    slug: "pte",
    name: "PTE Coaching",
    icon: "💻",
    tagline: "Computer-delivered test strategy, templates, and timed practice.",
    description:
      "PTE Academic is scored by AI, which means strategy and templates matter as much as raw English ability. Our course covers every task type across Speaking, Writing, Reading, and Listening, with a strong focus on the scoring algorithm's patterns — what it rewards, what it penalizes, and how to structure answers accordingly.",
    modules: [
      { title: "Speaking & Writing", desc: "Read Aloud, Repeat Sentence, Describe Image, Retell Lecture, and essay writing with proven templates." },
      { title: "Reading", desc: "Fill in the blanks, reorder paragraphs, and multiple choice, practiced against the clock." },
      { title: "Listening", desc: "Summarize spoken text, fill in the blanks, and highlight correct summary — pattern recognition for AI scoring." },
      { title: "Exam Strategy", desc: "Time management across the full test and how to navigate the exact exam interface." },
    ],
    forWhom: [
      "Students who want a faster result than IELTS typically allows",
      "Applicants to Australia, New Zealand, and Canada (widely accepted)",
      "Those more comfortable with computer-based testing",
    ],
    duration: "Flexible batches — typically 3–6 weeks",
    faqs: [
      { q: "Is PTE easier than IELTS?", a: "Not easier exactly, but more predictable — since it's AI-scored, strong templates and strategy consistently produce reliable results." },
      { q: "How fast are PTE results?", a: "Usually within 1–2 business days, much faster than IELTS." },
      { q: "Do you provide practice on the real test software?", a: "Yes, our timed practice matches the actual PTE Academic interface." },
    ],
  },
  {
    slug: "spoken-english",
    name: "Spoken English",
    icon: "🗣️",
    tagline: "Confidence-first speaking practice for daily life, interviews, and work.",
    description:
      "This course is built for students who understand English but freeze when they need to speak it. We focus on breaking the habit of translating from Punjabi/Hindi in your head, building real conversational fluency through daily speaking practice, grammar in context, and vocabulary you'll actually use — not just textbook lists.",
    modules: [
      { title: "Grammar in Context", desc: "Simple Present through Conditionals, taught through speaking practice rather than isolated drills." },
      { title: "Vocabulary & Idioms", desc: "250+ everyday words and common idioms, drilled with visual presentations and games." },
      { title: "Pronunciation", desc: "Word and sentence stress, plus common sounds that trip up Punjabi speakers specifically." },
      { title: "Real Conversation", desc: "Interviews, phone calls, workplace English, and everyday situations — practiced live, not scripted." },
    ],
    forWhom: [
      "Complete beginners building English from scratch",
      "Intermediate speakers who want to sound more natural",
      "Anyone preparing for job interviews or workplace communication",
    ],
    duration: "Beginner to Advanced, self-paced batches",
    faqs: [
      { q: "I understand English but can't speak it — is this for me?", a: "Yes, this is exactly who the course is designed for." },
      { q: "Do I need any prior English knowledge?", a: "No, we have a dedicated beginner track that starts from the basics." },
      { q: "How is this different from IELTS Speaking prep?", a: "This is for everyday fluency and confidence, not exam scoring — though it's a great foundation before IELTS/PTE." },
    ],
  },
  {
    slug: "german",
    name: "German A1–B1",
    icon: "🇩🇪",
    tagline: "Structured German for study and work visas — A1 through B1.",
    description:
      "A complete German language curriculum taking you from zero to B1 level, the benchmark most study and work visa applications require. Covers grammar, vocabulary, and speaking practice with the same structured, Punjabi-explained teaching style as our English courses — and the same daily practice model through the Lexio app.",
    modules: [
      { title: "A1 — Foundations", desc: "Greetings, numbers, basic grammar (articles, cases), and everyday vocabulary." },
      { title: "A2 — Building Blocks", desc: "Past tense, more complex sentences, and expanded vocabulary for daily situations." },
      { title: "B1 — Fluency Threshold", desc: "The level most visa and university applications require — conversational fluency and complex grammar." },
      { title: "Exam Preparation", desc: "Goethe-Institut format practice tests and speaking exam simulation." },
    ],
    forWhom: [
      "Students applying to German universities",
      "Those pursuing German work visas (Ausbildung, skilled worker routes)",
      "Complete beginners — no prior German needed",
    ],
    duration: "Structured A1 → A2 → B1 progression, typically 6–9 months total",
    faqs: [
      { q: "Do I need any German background to start?", a: "No, the A1 track starts from absolute zero." },
      { q: "Is B1 enough for a German visa?", a: "B1 is the most commonly required level for study and work visas — we'll confirm the exact requirement for your specific visa type." },
      { q: "How is this taught differently from generic German apps?", a: "Grammar explanations in Punjabi where it helps, plus real classroom speaking practice — not just app drilling." },
    ],
  },
];

export function getCourse(slug: string) {
  return COURSES.find((c) => c.slug === slug);
}

'@
Set-Content -Path "app\data\courses.ts" -Value $content -Encoding UTF8
Write-Host "  Wrote app\data\courses.ts"
$content = @'
"use client";

import { useRef, useState, useEffect } from "react";
import Chatbot from "../components/Chatbot";
import Link from "next/link";

function Barcode() {
  // Purely decorative — generated client-side only, after mount, so the
  // random heights don't cause a server/client hydration mismatch.
  const [bars, setBars] = useState<number[] | null>(null);
  useEffect(() => {
    setBars(Array.from({ length: 40 }, () => 30 + Math.random() * 50));
  }, []);
  return (
    <div className="pass-barcode">
      {bars?.map((h, i) => (
        <div key={i} style={{ height: h + "%" }} />
      ))}
    </div>
  );
}

// Same Google Sheet the chatbot saves leads to — keeps everything in one place.
const SHEET_URL = "https://script.google.com/macros/s/AKfycbwExqnIZvubS7LLWU6ZgNdK73GJDI3jY0fwhLyMlDtNorIfGwotRdRl17wEJX5U9dVYJQ/exec";

export default function Home() {
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const courseRef = useRef<HTMLSelectElement>(null);
  const [submitting, setSubmitting] = useState(false);

  // Saves the lead to the shared Google Sheet, then opens WhatsApp with
  // the details pre-filled — so every lead is captured even if the
  // visitor never actually sends the WhatsApp message.
  async function submitLead() {
    const name = nameRef.current?.value.trim() || "";
    const phone = phoneRef.current?.value.trim() || "";
    const course = courseRef.current?.value || "";
    if (!name || !phone) {
      alert("Please enter your name and mobile number.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setSubmitting(true);
    try {
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, course, source: "Homepage Demo Form" }),
      });
    } catch (e) {
      console.log("Sheet save error:", e);
    }
    setSubmitting(false);
    const msg = `Hi Pioneer Education, I'd like to book a free demo class.%0A%0AName: ${name}%0AMobile: ${phone}%0ACourse: ${course}`;
    window.open("https://wa.me/917380261308?text=" + msg, "_blank");
  }

  return (
    <>
<nav>
  <div className="nav-inner">
    <div className="logo"><div className="logo-mark">P</div>Pioneer Education</div>
    <div className="nav-links">
      <a href="#courses">Courses</a>
      <a href="#results">Results</a>
      <a href="#pricing">Pricing</a>
      <a href="#app">Lexio App</a>
      <a href="/about">About</a>
      <a href="/writing-analyzer">Writing Analyzer</a>
      <a href="#reviews">Reviews</a>
      <a href="#demo">Free Demo</a>
      <a href="#contact">Contact</a>
    </div>
    <div className="nav-cta">
      <a href="#demo" className="btn btn-coral">Book Free Demo</a>
    </div>
  </div>
</nav>

<section className="hero">
  <div className="wrap hero-grid">
    <div>
      <div className="eyebrow">Prem Nagar, Morinda · Since 2017</div>
      <h1>Your next stop is <em>Band 7.5</em>, not another classroom.</h1>
      <p className="lede">IELTS, PTE, Spoken English &amp; German coaching built on nine years of watching exactly where Punjabi students lose marks — and fixing it before test day.</p>
      <div className="hero-ctas">
        <a href="#demo" className="btn btn-coral">Book a Free Demo Class</a>
        <a href="#app" className="btn btn-outline">Try the Lexio App</a>
      </div>
      <div className="trust-row">
        <div className="trust-item"><div className="num">9+</div><div className="lbl">Years Coaching</div></div>
        <div className="trust-item"><div className="num">4</div><div className="lbl">Courses Offered</div></div>
        <div className="trust-item"><div className="num">125+</div><div className="lbl">Google Reviews</div></div>
        <div className="trust-item"><div className="num">5.0★</div><div className="lbl">Google Rating</div></div>
      </div>
    </div>

    <div className="pass">
      <div className="pass-seal"><span>PIONEER<br />VERIFIED</span></div>
      <div className="pass-top">
        <div className="pass-brand">
          <div className="name">PIONEER EDUCATION</div>
          <div className="tag mono">TEST-READY PASS</div>
        </div>
        <div className="pass-route">
          <div className="pass-loc">
            <div className="code">MOR</div>
            <div className="city">Morinda, PB</div>
          </div>
          <div className="pass-arrow">
            <svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="10" x2="180" y2="10" stroke="white" strokeDasharray="4 5" strokeWidth="1.5"/><path d="M180 4 L192 10 L180 16" stroke="white" strokeWidth="1.5" fill="none"/></svg>
          </div>
          <div className="pass-loc" style={{textAlign: 'right'}}>
            <div className="code">IELTS</div>
            <div className="city">Band 7.5+</div>
          </div>
        </div>
      </div>
      <div className="pass-bottom">
        <div className="pass-fields">
          <div className="pass-field"><div className="k">Student</div><div className="v">You, starting today</div></div>
          <div className="pass-field"><div className="k">Course</div><div className="v">IELTS Academic</div></div>
          <div className="pass-field"><div className="k">Coach</div><div className="v">Narinder Singh</div></div>
          <div className="pass-field"><div className="k">Practice Mode</div><div className="v">App + In-Person</div></div>
        </div>
        <Barcode />
        <div className="pass-footer">
          <div className="band">TARGET: 7.5</div>
          <div className="status">SEAT AVAILABLE</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="courses">
  <div className="wrap">
    <div className="section-head">
      <div className="section-eyebrow">What We Teach</div>
      <h2>Four courses. One goal — get you where you're going.</h2>
      <p>Every course pairs in-person coaching with practice on the Lexio app, so what you learn in class gets reinforced every single day, not just once a week.</p>
    </div>
    <div className="courses-grid">
      <Link href="/courses/ielts" className="course-card">
        <div className="stamp-num mono">01</div>
        <div className="course-icon" style={{background: 'var(--coral-light)', color: 'var(--coral-dark)'}}>✈️</div>
        <h3>IELTS</h3>
        <p>Academic &amp; General Training — full preparation for Reading, Writing, Listening &amp; Speaking with mock tests and personalized feedback.</p>
        <ul className="course-feats">
          <li>All 4 modules covered</li>
          <li>Weekly mock tests every Friday</li>
          <li>Detailed written feedback</li>
          <li>Expected writing topics</li>
        </ul>
        <span className="go">Explore IELTS →</span>
      </Link>
      <Link href="/courses/pte" className="course-card">
        <div className="stamp-num mono">02</div>
        <div className="course-icon" style={{background: 'var(--teal-light)', color: 'var(--teal)'}}>💻</div>
        <h3>PTE</h3>
        <p>Complete PTE preparation covering all zones — Listening, Speaking, Reading and Writing with timed practice.</p>
        <ul className="course-feats">
          <li>All PTE task types</li>
          <li>Speaking zone practice</li>
          <li>Listening labs</li>
          <li>Exam filling guidance</li>
        </ul>
        <span className="go">Explore PTE →</span>
      </Link>
      <Link href="/courses/spoken-english" className="course-card">
        <div className="stamp-num mono">03</div>
        <div className="course-icon" style={{background: 'var(--gold-light)', color: 'var(--coral-dark)'}}>💬</div>
        <h3>Spoken English</h3>
        <p>From Beginner to Advanced. Grammar, vocabulary, pronunciation, and everyday conversation. Stop translating from Hindi!</p>
        <ul className="course-feats">
          <li>250+ vocabulary words</li>
          <li>850 phrases &amp; idioms</li>
          <li>Visual presentations</li>
          <li>Everyday English</li>
        </ul>
        <span className="go">Explore Spoken English →</span>
      </Link>
      <Link href="/courses/german" className="course-card">
        <div className="stamp-num mono">04</div>
        <div className="course-icon" style={{background: 'var(--navy)', color: '#fff'}}>🇩🇪</div>
        <h3>German A1–B1</h3>
        <p>Full German language curriculum from scratch to B1 level — grammar, vocabulary, and exam preparation.</p>
        <ul className="course-feats">
          <li>A1 to B1 levels</li>
          <li>Grammar &amp; vocabulary</li>
          <li>Speaking practice</li>
          <li>Exam preparation</li>
        </ul>
        <span className="go">Explore German →</span>
      </Link>
    </div>
  </div>
</section>

<section id="why" className="why">
  <div className="wrap">
    <div className="section-head" style={{maxWidth: '100%'}}>
      <div className="section-eyebrow" style={{color: 'var(--gold)'}}>Why Pioneer Education</div>
      <h2 style={{color: '#fff'}}>We deliver more than you ask for.</h2>
    </div>
    <div className="why-features-grid">
      <div className="why-feat"><div className="wf-icon">⏰</div><h4>4–5 Hours Daily</h4><p>Intensive classes from 9 AM to 1 PM, with evening batches available.</p></div>
      <div className="why-feat"><div className="wf-icon">👤</div><h4>Individual Attention</h4><p>Maximum 8 students per batch, so every student gets personal focus.</p></div>
      <div className="why-feat"><div className="wf-icon">📊</div><h4>3 Level Material</h4><p>Beginner, Intermediate &amp; Advanced practice material designed for all levels.</p></div>
      <div className="why-feat"><div className="wf-icon">📝</div><h4>Weekly Mock Tests</h4><p>Every Friday mock test plus detailed feedback to track your progress.</p></div>
      <div className="why-feat"><div className="wf-icon">🖥️</div><h4>Visual Learning</h4><p>Every Saturday — visual presentations and vocabulary-building games.</p></div>
      <div className="why-feat"><div className="wf-icon">☎️</div><h4>24/7 Support</h4><p>Telegram channel + website + app support with daily sample answers.</p></div>
      <div className="why-feat"><div className="wf-icon">🌐</div><h4>Online &amp; Offline</h4><p>Live classes across India — join from anywhere with a phone or laptop.</p></div>
      <div className="why-feat"><div className="wf-icon">🏆</div><h4>Proven Results</h4><p>Students achieving 7.5+ in IELTS and 80+ in PTE consistently.</p></div>
    </div>
  </div>
</section>

<section id="results" style={{paddingTop: '0'}}>
  <div className="wrap">
    <div className="results-band">
      <h2>🏆 Recent student results</h2>
      <div className="rb-sub">Real scores from students who prepared with us — not stock numbers.</div>
      <div className="results-grid">
        <div className="result-chip">
          <div className="score">8.5</div>
          <div className="band-lbl">Listening</div>
          <div className="who">Arsh</div>
          <div className="exam">IELTS</div>
        </div>
        <div className="result-chip">
          <div className="score">7.5</div>
          <div className="band-lbl">Overall</div>
          <div className="who">Harshdeep Kaur</div>
          <div className="exam">IELTS</div>
        </div>
        <div className="result-chip">
          <div className="score">7.0</div>
          <div className="band-lbl">Overall</div>
          <div className="who">Sukhman Kaur</div>
          <div className="exam">IELTS</div>
        </div>
        <div className="result-chip">
          <div className="score">9.0</div>
          <div className="band-lbl">Listening</div>
          <div className="who">Harpreet Singh</div>
          <div className="exam">IELTS</div>
        </div>
        <div className="result-chip">
          <div className="score">9.0</div>
          <div className="band-lbl">Bands</div>
          <div className="who">Rai Sandeep</div>
          <div className="exam">IELTS</div>
        </div>
        <div className="result-chip">
          <div className="score">84</div>
          <div className="band-lbl">Score</div>
          <div className="who">Sunpreet Singh</div>
          <div className="exam">PTE</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="how-it-works" style={{paddingTop: '0'}}>
  <div className="wrap">
    <div className="section-head">
      <div className="section-eyebrow">How Classes Actually Run</div>
      <h2>The specifics, not the sales pitch.</h2>
      <p>What you actually get when you enroll — the details most institutes leave vague until after you've paid.</p>
    </div>
    <div className="facts-grid">
      <div className="fact-card">
        <h4>⏰ 4–5 hours daily</h4>
        <p>Intensive classes from 9 AM to 1 PM, with evening batches available for working students.</p>
      </div>
      <div className="fact-card">
        <h4>👤 Max 8 per batch</h4>
        <p>Small batches by design, so every student gets personal attention and speaking time.</p>
      </div>
      <div className="fact-card">
        <h4>📊 3-level material</h4>
        <p>Beginner, Intermediate and Advanced practice material — you start where you actually are.</p>
      </div>
      <div className="fact-card">
        <h4>📝 Weekly mock tests</h4>
        <p>Full mock test every Friday plus detailed written feedback to track real progress.</p>
      </div>
      <div className="fact-card">
        <h4>🖥️ Online &amp; offline</h4>
        <p>Attend in Morinda or join live from anywhere in India by phone or laptop.</p>
      </div>
      <div className="fact-card">
        <h4>💬 Daily app practice</h4>
        <p>The Lexio app keeps you practising between classes — vocabulary, quizzes, pronunciation.</p>
      </div>
      <div className="fact-card">
        <h4>🎨 Visual learning Saturdays</h4>
        <p>Every Saturday: visual presentations and vocabulary games instead of standard drills.</p>
      </div>
      <div className="fact-card">
        <h4>🏆 Proven results</h4>
        <p>Students consistently achieving 7.5+ in IELTS and 80+ in PTE — see recent scores above.</p>
      </div>
    </div>
    <div style={{marginTop: '20px', borderRadius: '20px', overflow: 'hidden', position: 'relative'}}>
      <img src="/images/ielts-classroom.jpg" alt="IELTS Writing Task 1 class in progress at Pioneer Education Center, Morinda" style={{width: '100%', display: 'block'}} />
      <div style={{position: 'absolute', left: '0', right: '0', bottom: '0', padding: '40px 24px 18px', background: 'linear-gradient(transparent,rgba(0,0,0,0.75))', color: '#fff', fontSize: '0.88rem', fontWeight: '600'}}>A real IELTS Writing Task 1 session — Prem Nagar, Morinda</div>
    </div>
  </div>
</section>

<section id="pricing">
  <div className="wrap">
    <div className="section-head">
      <div className="section-eyebrow">Investment</div>
      <h2>Simple, honest pricing.</h2>
      <p>First demo class always free · Sibling discount 20% · Refer &amp; Earn ₹500</p>
    </div>
    <div className="pricing-grid">
      <div className="price-card">
        <div className="pc-name">Material Access</div>
        <div className="pc-price">₹499<span>/month</span></div>
        <ul className="course-feats">
          <li>Study material &amp; resources</li>
          <li>Practice exercises &amp; quizzes</li>
          <li>Self-paced learning</li>
        </ul>
        <a href="#contact" className="btn btn-outline" style={{width: '100%', justifyContent: 'center'}}>Enroll Now</a>
      </div>
      <div className="price-card featured">
        <div className="pc-badge">Most Popular</div>
        <div className="pc-name" style={{color: 'rgba(255,255,255,0.8)'}}>Group Class</div>
        <div className="pc-price" style={{color: '#fff'}}>₹2,499<span style={{color: 'rgba(255,255,255,0.7)'}}>/month</span></div>
        <ul className="course-feats" style={{color: 'rgba(255,255,255,0.85)'}}>
          <li style={{color: 'rgba(255,255,255,0.9)'}}>Live classes 5 days/week</li>
          <li style={{color: 'rgba(255,255,255,0.9)'}}>Max 8 students per batch</li>
          <li style={{color: 'rgba(255,255,255,0.9)'}}>Online + Offline</li>
          <li style={{color: 'rgba(255,255,255,0.9)'}}>Weekly progress feedback</li>
          <li style={{color: 'rgba(255,255,255,0.9)'}}>Certificate on completion</li>
        </ul>
        <a href="#contact" className="btn" style={{width: '100%', justifyContent: 'center', background: '#fff', color: 'var(--coral-dark)'}}>Enroll Now</a>
      </div>
      <div className="price-card">
        <div className="pc-name">1-to-1 Coaching</div>
        <div className="pc-price">₹4,999<span>/month</span></div>
        <ul className="course-feats">
          <li>Dedicated personal sessions</li>
          <li>Custom curriculum</li>
          <li>Flexible timings</li>
          <li>Interview prep</li>
          <li>Priority WhatsApp support</li>
        </ul>
        <a href="#contact" className="btn btn-outline" style={{width: '100%', justifyContent: 'center'}}>Enroll Now</a>
      </div>
    </div>
    <div className="price-note">📞 &nbsp;IELTS, PTE &amp; German fees — contact us on WhatsApp for custom pricing based on your requirement and batch type. <strong>WhatsApp: +91 73802 61308</strong></div>
  </div>
</section>

<section id="difference" className="why">
  <div className="wrap why-grid">
    <div>
      <div className="section-eyebrow" style={{color: 'var(--gold)'}}>The Pioneer Difference</div>
      <h2>Nine years of mistakes, already mapped.</h2>
      <p className="why-lede">Most institutes teach the test. We've spent nearly a decade cataloguing exactly where students from this region lose marks — and built that into every lesson and every app quiz.</p>
      <div className="why-list">
        <div className="why-item">
          <div className="n mono">01</div>
          <div><h4>Pattern-based correction</h4><p>Grammar explanations in Punjabi, targeted at mistakes we've seen hundreds of times — not generic textbook rules.</p></div>
        </div>
        <div className="why-item">
          <div className="n mono">02</div>
          <div><h4>Practice that doesn't stop at the classroom door</h4><p>The Lexio app extends every lesson into daily quizzes, vocabulary, and pronunciation practice — with streaks that keep you consistent.</p></div>
        </div>
        <div className="why-item">
          <div className="n mono">03</div>
          <div><h4>Real mock tests, real feedback</h4><p>Full-length simulations scored and reviewed by a real instructor — not just an answer key.</p></div>
        </div>
      </div>
    </div>
    <div className="why-panel">
      <div className="stat-grid">
        <div className="stat"><div className="num">9+</div><div className="lbl">Years teaching IELTS &amp; PTE</div></div>
        <div className="stat"><div className="num">47</div><div className="lbl">Structured app lessons</div></div>
        <div className="stat"><div className="num">1,434+</div><div className="lbl">App quiz questions</div></div>
        <div className="stat"><div className="num">4</div><div className="lbl">Courses — IELTS to German</div></div>
      </div>
    </div>
  </div>
</section>

<section id="app">
  <div className="wrap">
    <div className="app-cta">
      <div>
        <div className="eyebrow" style={{background: 'rgba(255,255,255,0.2)', color: '#fff'}}>Free To Start</div>
        <h2>Meet Lexio — practice that follows you home.</h2>
        <p>Our own learning app, built specifically for Pioneer Education students. Vocabulary, grammar, and full IELTS practice — with real progress tracking and a coach who can see how you're doing.</p>
        <div className="app-feats">
          <div>🔥 &nbsp;Daily streaks that actually build a habit</div>
          <div>🔊 &nbsp;Tap-to-hear pronunciation on every word</div>
          <div>📚 &nbsp;47 structured lessons, Beginner to IELTS</div>
          <div>🎯 &nbsp;1,434+ practice questions with Punjabi explanations</div>
        </div>
        <div style={{marginTop: '28px', display: 'flex', gap: '14px'}}>
          <a href="#" className="btn" style={{background: '#fff', color: 'var(--coral-dark)'}}>Get the App</a>
          <a href="#contact" className="btn btn-ghost-light">Ask About Access</a>
        </div>
      </div>
      <div className="phone-mock">
        <div className="phone-screen">
          <div className="ps-header">🔥 14 Day Streak</div>
          <div className="ps-row"><span>Word of the Day</span><span className="tag">🔊</span></div>
          <div className="ps-row"><span>IELTS · Writing Task 2</span><span className="tag">3/3 ✓</span></div>
          <div className="ps-row"><span>Grammar · Conditionals</span><span className="tag">In progress</span></div>
          <div className="ps-row"><span>XP earned this week</span><span className="tag">+340</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="instructor">
  <div className="wrap instructor">
    <div>
      <div style={{borderRadius: '22px', overflow: 'hidden', marginBottom: '0'}}>
        <img src="/images/instructor.jpg" alt="Narinder Singh, founder of Pioneer Education Center, Morinda" style={{width: '100%', display: 'block'}} />
      </div>
    </div>
    <div>
      <div className="role">Meet Your Instructor</div>
      <div className="name">Narinder Singh</div>
      <blockquote>"Every mistake a student makes has been made by someone before them. My job is to make sure you don't repeat it."</blockquote>
      <p className="bio">Narinder Singh founded Pioneer Education in 2017 as a TEFL-certified instructor, and has built a teaching approach rooted in pattern recognition — identifying exactly where each student's English breaks down, and fixing that specific gap rather than teaching generically. Today he leads a team of instructors delivering the same method across all four courses.</p>
      <div className="cred-row">
        <div className="cred"><div className="cred-icon">🎓</div><span>TEFL Certified</span></div>
        <div className="cred"><div className="cred-icon">⭐</div><span>5.0★ Google Rating</span></div>
        <div className="cred"><div className="cred-icon">📍</div><span>Prem Nagar, Morinda</span></div>
      </div>
    </div>
  </div>
</section>

<section id="reviews">
  <div className="wrap">
    <div className="section-head">
      <div className="section-eyebrow">From Our Students</div>
      <h2>5.0★ on Google, from 125+ real reviews.</h2>
    </div>
    <div className="reviews-strip">
      <div className="review-card">
        <div className="review-stars">★★★★★</div>
        <p>"Narinder Dhiman is the best teacher I have ever seen. I achieved my band scores only because of him. Anyone who thinks they can't achieve bands in IELTS must visit here."</p>
        <div className="reviewer"><div className="reviewer-avatar">HS</div><div><div className="rn">Harmeet Singh</div><div className="rr">Google Review</div></div></div>
      </div>
      <div className="review-card">
        <div className="review-stars">★★★★★</div>
        <p>"Pioneer Education is the best place to learn English. Staff is highly educated and polite. Visual presentations are very interesting. Sir also teaches life skills too."</p>
        <div className="reviewer"><div className="reviewer-avatar">RK</div><div><div className="rn">Ramneet Kang</div><div className="rr">Google Review</div></div></div>
      </div>
      <div className="review-card">
        <div className="review-stars">★★★★★</div>
        <p>"All teachers are highly qualified, very helpful and kind. I built my confidence and communication skills here. I learned important lessons and met inspiring teachers."</p>
        <div className="reviewer"><div className="reviewer-avatar">PK</div><div><div className="rn">Pavanpreet Kaur</div><div className="rr">Google Review</div></div></div>
      </div>
      <div className="review-card">
        <div className="review-stars">★★★★★</div>
        <p>"You can see the difference in the first 2 to 3 classes. They give suggestions to take good bands in IELTS and provide personal attention to every student."</p>
        <div className="reviewer"><div className="reviewer-avatar">HS</div><div><div className="rn">Harman Singh</div><div className="rr">Google Review</div></div></div>
      </div>
    </div>
  </div>
</section>

<section id="demo" style={{paddingBottom: '0'}}>
  <div className="wrap">
    <div className="lead-wrap">
      <div>
        <div className="section-eyebrow">Book a Free Demo</div>
        <h2>Try one class before you pay anything.</h2>
        <p>Leave your details and we'll message you on WhatsApp with the next available demo slot. No payment, no commitment.</p>
        <div className="lead-perks">
          <div>✓ &nbsp;First demo class always free</div>
          <div>✓ &nbsp;Sibling discount 20%</div>
          <div>✓ &nbsp;Refer &amp; Earn ₹500</div>
        </div>
      </div>
      <div className="lead-form">
        <div>
          <label htmlFor="lead-name">Your Name</label>
          <input type="text" id="lead-name" ref={nameRef} placeholder="e.g. Gurpreet Singh" required />
        </div>
        <div>
          <label htmlFor="lead-phone">Mobile Number</label>
          <input type="tel" id="lead-phone" ref={phoneRef} placeholder="10-digit mobile number" required />
        </div>
        <div>
          <label htmlFor="lead-course">Course You're Interested In</label>
          <select id="lead-course" ref={courseRef}>
            <option>IELTS</option>
            <option>PTE</option>
            <option>Spoken English</option>
            <option>German A1–B1</option>
            <option>Not sure yet</option>
          </select>
        </div>
        <button type="button" className="btn btn-coral" style={{width: '100%', justifyContent: 'center', marginTop: '6px', opacity: submitting ? 0.6 : 1}} onClick={submitLead} disabled={submitting}>{submitting ? 'Saving...' : 'Request Free Demo Class'}</button>
        <div className="lead-note">We'll only use your number to contact you about classes.</div>
      </div>
    </div>
  </div>
</section>

<section id="chat" style={{paddingBottom: '0'}}>
  <div className="wrap" style={{textAlign: 'center', maxWidth: '600px'}}>
    <div className="section-eyebrow">Have Questions?</div>
    <h2 style={{fontSize: '1.9rem', color: 'var(--navy)', fontWeight: 600, marginBottom: '10px'}}>Our AI assistant answers instantly.</h2>
    <p style={{color: 'var(--grey)', fontSize: '0.98rem', marginBottom: '28px'}}>Or WhatsApp us directly at 73802-61308 if you'd rather talk to a person.</p>
    <Chatbot />
  </div>
</section>

<section id="contact">
  <div className="wrap">
    <div className="section-head">
      <div className="section-eyebrow">Visit Us</div>
      <h2>Find us in Prem Nagar, Morinda.</h2>
    </div>
    <div className="branches-grid" style={{gridTemplateColumns: '1fr', maxWidth: '520px'}}>
      <div className="branch-card">
        <div className="branch-name">📍 Morinda Centre</div>
        <p>1st Floor, Kalsi Cafe,<br />Opp. Khalsa Girls College,<br />Prem Nagar, Morinda 140101, Punjab</p>
        <p style={{fontSize: '0.85rem', marginBottom: '12px'}}>Mon–Sat · 8:30 AM – 7:00 PM &nbsp;·&nbsp; Sunday closed</p>
        <a href="tel:+917380261308" className="branch-phone">📞 +91 73802-61308</a>
      </div>
    </div>

    <div className="final-cta">
      <h2>Your test date is closer than you think.</h2>
      <p>Book a free demo class in Morinda, or start practicing on Lexio today — either way, let's get you moving.</p>
      <div className="btns">
        <a href="https://wa.me/917380261308" className="btn btn-coral">Message Us on WhatsApp</a>
        <a href="#app" className="btn" style={{background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)'}}>Get the Lexio App</a>
      </div>
    </div>
  </div>
</section>

<footer>
  <div className="wrap">
    <div className="footer-grid">
      <div>
        <div className="logo" style={{marginBottom: '14px'}}><div className="logo-mark">P</div>Pioneer Education</div>
        <p style={{color: 'var(--grey)', fontSize: '0.88rem', maxWidth: '260px'}}>IELTS, PTE, Spoken English &amp; German coaching in Prem Nagar, Morinda, Punjab. Since 2017.</p>
      </div>
      <div>
        <h5>Courses</h5>
        <a href="#courses">IELTS</a>
        <a href="#courses">PTE</a>
        <a href="#courses">Spoken English</a>
        <a href="#courses">German A1–B1</a>
      </div>
      <div>
        <h5>Company</h5>
        <a href="#why">Why Pioneer</a>
        <a href="#instructor">Instructor</a>
        <a href="#reviews">Reviews</a>
        <a href="#app">Lexio App</a>
      </div>
      <div>
        <h5>Contact</h5>
        <a href="https://wa.me/917380261308">WhatsApp: 73802-61308</a>
        <a href="#">Morinda, Prem Nagar</a>
        <a href="https://maps.google.com/?q=Pioneer+Spoken+English+IELTS+Morinda" target="_blank" rel="noopener noreferrer">Opp. Khalsa Girls College</a>
        <a href="#">@ielts_pioneer</a>
      </div>
    </div>
    <div className="footer-bottom">
      <div>© 2026 Pioneer Education Center. All rights reserved.</div>
      <div>#IELTSwithNarinderSir</div>
    </div>
  </div>
</footer>

<Chatbot />
    </>
  );
}

'@
Set-Content -Path "app\page.tsx" -Value $content -Encoding UTF8
Write-Host "  Wrote app\page.tsx"
$content = @'
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pioneer Education — IELTS, PTE, Spoken English & German | Morinda, Punjab",
  description:
    "Pioneer Education Center, Prem Nagar, Morinda, Punjab — IELTS, PTE, Spoken English & German coaching since 2017, led by Narinder Singh. Rated 5.0 stars from 125+ students. Practice with our Lexio app and real test simulations.",
  metadataBase: new URL("https://pioneermorinda.com"),
  openGraph: {
    title: "Pioneer Education — IELTS, PTE, Spoken English & German",
    description:
      "IELTS, PTE, Spoken English & German coaching in Morinda, Punjab. 5.0★ rating, 125+ reviews. Free demo class available.",
    url: "https://pioneermorinda.com",
    siteName: "Pioneer Education Center",
    locale: "en_IN",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Pioneer Education Center",
  alternateName: "Pioneer Spoken English IELTS",
  description:
    "IELTS, PTE, Spoken English and German A1–B1 coaching in Prem Nagar, Morinda, Punjab. Established 2017.",
  url: "https://pioneermorinda.com",
  telephone: "+91-98559-91214",
  foundingDate: "2017",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1st Floor, Kalsi Cafe, Opp. Khalsa Girls College, Prem Nagar",
    addressLocality: "Morinda",
    addressRegion: "Punjab",
    postalCode: "140101",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 30.7918389,
    longitude: 76.496942,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "125",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:30",
      closes: "19:00",
    },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Courses",
    itemListElement: [
      { "@type": "Course", name: "IELTS Coaching", description: "Academic & General Training preparation for all four modules.", provider: { "@type": "Organization", name: "Pioneer Education Center" } },
      { "@type": "Course", name: "PTE Coaching", description: "Computer-delivered test strategy and timed practice.", provider: { "@type": "Organization", name: "Pioneer Education Center" } },
      { "@type": "Course", name: "Spoken English", description: "Confidence-first speaking practice, beginner to advanced.", provider: { "@type": "Organization", name: "Pioneer Education Center" } },
      { "@type": "Course", name: "German A1–B1", description: "Structured German for study and work visas.", provider: { "@type": "Organization", name: "Pioneer Education Center" } },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

'@
Set-Content -Path "app\layout.tsx" -Value $content -Encoding UTF8
Write-Host "  Wrote app\layout.tsx"
$content = @'
:root{
    --navy:#161616; --navy-light:#262626;
    --coral:#DB6A0C; --coral-dark:#B85704; --coral-light:#FBEBDD;
    --cream:#FAFAF9; --paper:#FFFFFF;
    --gold:#525252; --gold-light:#F0F0F0;
    --teal:#404040; --teal-light:#F5F5F4;
    --ink:#171717; --grey:#6B6B6B; --grey-light:#E4E4E4;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{font-family:'Inter',sans-serif;background:var(--cream);color:var(--ink);line-height:1.6;overflow-x:hidden;}
  h1,h2,h3,.display{font-family:'Fraunces',serif;letter-spacing:-0.01em;}
  .mono{font-family:'JetBrains Mono',monospace;}
  a{color:inherit;text-decoration:none;}
  img{max-width:100%;display:block;}
  .wrap{max-width:1180px;margin:0 auto;padding:0 24px;}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:15px 30px;border-radius:100px;font-weight:700;font-size:0.95rem;cursor:pointer;border:none;transition:transform 0.2s, box-shadow 0.2s;}
  .btn-coral{background:var(--coral);color:#fff;box-shadow:0 8px 24px rgba(232,114,12,0.35);}
  .btn-coral:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(232,114,12,0.45);}
  .btn-outline{background:transparent;color:var(--navy);border:2px solid var(--navy);}
  .btn-outline:hover{background:var(--navy);color:#fff;}
  .btn-ghost-light{background:rgba(255,255,255,0.12);color:#fff;border:1.5px solid rgba(255,255,255,0.4);}

  /* ── NAV ── */
  nav{position:sticky;top:0;z-index:100;background:rgba(250,250,249,0.92);backdrop-filter:blur(10px);border-bottom:1px solid rgba(17,17,17,0.08);}
  .nav-inner{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;max-width:1180px;margin:0 auto;}
  .logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.15rem;color:var(--navy);}
  .logo-mark{width:36px;height:36px;border-radius:10px;background:var(--coral);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-weight:700;font-size:1.1rem;}
  .nav-links{display:flex;gap:32px;font-weight:600;font-size:0.92rem;color:var(--navy);}
  .nav-links a:hover{color:var(--coral);}
  .nav-cta{display:flex;gap:12px;align-items:center;}
  @media (max-width:860px){ .nav-links{display:none;} }

  /* ── HERO ── */
  .hero{position:relative;padding:64px 0 40px;overflow:hidden;}
  .hero-grid{display:grid;grid-template-columns:1.1fr 0.9fr;gap:56px;align-items:center;}
  @media (max-width:960px){ .hero-grid{grid-template-columns:1fr;} }
  .eyebrow{display:inline-flex;align-items:center;gap:8px;background:var(--gold-light);color:var(--coral-dark);font-weight:700;font-size:0.78rem;letter-spacing:0.06em;text-transform:uppercase;padding:7px 16px;border-radius:100px;margin-bottom:22px;}
  .eyebrow::before{content:"●";color:var(--gold);font-size:0.7em;}
  .hero h1{font-size:3.1rem;line-height:1.06;color:var(--navy);margin-bottom:22px;font-weight:600;}
  .hero h1 em{font-style:normal;color:var(--coral);}
  @media (max-width:960px){ .hero h1{font-size:2.3rem;} }
  .hero p.lede{font-size:1.15rem;color:var(--grey);max-width:520px;margin-bottom:32px;}
  .hero-ctas{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:36px;}
  .trust-row{display:flex;gap:28px;flex-wrap:wrap;}
  .trust-item{display:flex;flex-direction:column;}
  .trust-item .num{font-family:'Fraunces',serif;font-weight:700;font-size:1.6rem;color:var(--navy);}
  .trust-item .lbl{font-size:0.8rem;color:var(--grey);font-weight:500;}

  /* ── BOARDING PASS (signature hero element) ── */
  .pass{position:relative;background:var(--navy);border-radius:22px;padding:0;box-shadow:0 30px 60px -20px rgba(17,17,17,0.5);transform:rotate(2deg);}
  .pass::before,.pass::after{content:"";position:absolute;width:26px;height:26px;background:var(--cream);border-radius:50%;top:50%;transform:translateY(-50%);}
  .pass::before{left:-13px;}
  .pass::after{right:-13px;}
  .pass-top{padding:26px 28px 20px;border-bottom:2px dashed rgba(255,255,255,0.25);}
  .pass-brand{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
  .pass-brand .name{color:#fff;font-weight:800;font-size:0.85rem;letter-spacing:0.04em;}
  .pass-brand .tag{color:rgba(255,255,255,0.5);font-size:0.7rem;font-family:'JetBrains Mono',monospace;}
  .pass-route{display:flex;align-items:center;justify-content:space-between;}
  .pass-loc{color:#fff;}
  .pass-loc .code{font-family:'Fraunces',serif;font-size:2.1rem;font-weight:700;line-height:1;}
  .pass-loc .city{font-size:0.75rem;color:rgba(255,255,255,0.6);margin-top:4px;}
  .pass-arrow{flex:1;display:flex;align-items:center;justify-content:center;position:relative;padding:0 16px;}
  .pass-arrow svg{width:100%;opacity:0.5;}
  .pass-bottom{padding:22px 28px 28px;}
  .pass-fields{display:grid;grid-template-columns:1fr 1fr;gap:16px 20px;margin-bottom:22px;}
  .pass-field .k{color:rgba(255,255,255,0.45);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;margin-bottom:4px;}
  .pass-field .v{color:#fff;font-weight:600;font-size:0.92rem;}
  .pass-seal{position:absolute;top:20px;right:26px;width:64px;height:64px;border-radius:50%;border:2.5px dashed var(--gold);display:flex;align-items:center;justify-content:center;transform:rotate(-12deg);}
  .pass-seal span{color:var(--gold);font-family:'Fraunces',serif;font-weight:700;font-size:0.62rem;text-align:center;line-height:1.15;}
  .pass-barcode{display:flex;gap:2px;height:34px;align-items:flex-end;margin-bottom:14px;}
  .pass-barcode div{background:rgba(255,255,255,0.5);width:3px;}
  .pass-footer{display:flex;justify-content:space-between;align-items:center;}
  .pass-footer .band{font-family:'JetBrains Mono',monospace;color:var(--gold);font-weight:700;font-size:0.95rem;}
  .pass-footer .status{background:rgba(255,255,255,0.15);color:#E4E4E4;font-size:0.68rem;font-weight:700;padding:4px 10px;border-radius:100px;}

  /* ── SECTIONS shared ── */
  section{padding:90px 0;}
  .section-head{max-width:640px;margin-bottom:56px;}
  .section-eyebrow{color:var(--coral);font-weight:700;font-size:0.78rem;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:14px;}
  .section-head h2{font-size:2.3rem;color:var(--navy);font-weight:600;line-height:1.15;}
  .section-head p{color:var(--grey);font-size:1.05rem;margin-top:14px;}

  /* ── COURSES ── */
  .courses-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;}
  @media (max-width:960px){ .courses-grid{grid-template-columns:repeat(2,1fr);} }
  @media (max-width:560px){ .courses-grid{grid-template-columns:1fr;} }
  .course-card{background:var(--paper);border-radius:18px;padding:28px 24px;border:1px solid rgba(17,17,17,0.08);transition:transform 0.25s, box-shadow 0.25s;position:relative;overflow:hidden;}
  .course-card:hover{transform:translateY(-6px);box-shadow:0 20px 40px -12px rgba(17,17,17,0.18);}
  .course-card .stamp-num{position:absolute;top:-10px;right:-6px;font-family:'JetBrains Mono',monospace;font-size:5rem;font-weight:700;color:rgba(17,17,17,0.04);}
  .course-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:20px;}
  .course-card h3{font-size:1.2rem;color:var(--navy);margin-bottom:10px;font-weight:600;}
  .course-card p{color:var(--grey);font-size:0.9rem;margin-bottom:18px;}
  .course-card .go{color:var(--coral);font-weight:700;font-size:0.85rem;display:inline-flex;align-items:center;gap:6px;}
  .course-feats{list-style:none;margin-bottom:18px;}
  .course-feats li{font-size:0.83rem;color:var(--grey);margin-bottom:7px;padding-left:20px;position:relative;}
  .course-feats li::before{content:"✓";position:absolute;left:0;color:var(--coral);font-weight:700;}

  /* ── WHY US / DIFFERENTIATOR ── */
  .why{background:var(--navy);color:#fff;position:relative;}
  .why-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;}
  @media (max-width:900px){ .why-grid{grid-template-columns:1fr;gap:40px;} }
  .why h2{color:#fff;font-size:2.2rem;font-weight:600;}
  .why-lede{color:rgba(255,255,255,0.65);margin:18px 0 32px;font-size:1.05rem;}
  .why-list{display:flex;flex-direction:column;gap:22px;}
  .why-item{display:flex;gap:16px;}
  .why-item .n{font-family:'Fraunces',serif;font-weight:700;font-size:1.3rem;color:var(--gold);flex-shrink:0;width:34px;}
  .why-item h4{font-size:1.02rem;margin-bottom:4px;font-weight:700;}
  .why-item p{color:rgba(255,255,255,0.6);font-size:0.9rem;}
  .why-panel{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:36px;}
  .stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;}
  .stat .num{font-family:'Fraunces',serif;font-weight:700;font-size:2.4rem;color:var(--coral);}
  .stat .lbl{color:rgba(255,255,255,0.55);font-size:0.85rem;margin-top:4px;}

  /* ── WHY US FEATURE GRID (8 features) ── */
  .why-features-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;margin-top:20px;}
  @media (max-width:900px){ .why-features-grid{grid-template-columns:repeat(2,1fr);} }
  @media (max-width:560px){ .why-features-grid{grid-template-columns:1fr;} }
  .why-feat{background:var(--navy);padding:28px 22px;}
  .wf-icon{font-size:1.6rem;margin-bottom:14px;}
  .why-feat h4{color:#fff;font-size:0.98rem;margin-bottom:8px;font-weight:700;}
  .why-feat p{color:rgba(255,255,255,0.55);font-size:0.83rem;line-height:1.5;}

  /* ── PRICING ── */
  .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:20px;}
  @media (max-width:860px){ .pricing-grid{grid-template-columns:1fr;} }
  .price-card{background:var(--paper);border:1.5px solid rgba(20,33,61,0.08);border-radius:18px;padding:30px 26px;position:relative;}
  .price-card.featured{background:var(--navy);border-color:var(--navy);transform:scale(1.03);}
  .pc-badge{position:absolute;top:-13px;left:26px;background:var(--coral);color:#fff;font-size:0.72rem;font-weight:700;padding:5px 14px;border-radius:100px;}
  .pc-name{color:var(--grey);font-size:0.95rem;font-weight:600;margin-bottom:10px;}
  .pc-price{font-family:'Fraunces',serif;font-size:2.2rem;font-weight:700;color:var(--navy);margin-bottom:20px;}
  .pc-price span{font-size:0.9rem;font-weight:500;color:var(--grey);}
  .price-note{background:var(--gold-light);border-radius:14px;padding:18px 22px;font-size:0.9rem;color:var(--ink);text-align:center;}
  .price-note strong{color:var(--coral-dark);}

  /* ── APP CTA ── */
  .app-cta{background:linear-gradient(135deg,var(--coral),var(--coral-dark));border-radius:28px;padding:56px;display:grid;grid-template-columns:1.1fr 0.9fr;gap:40px;align-items:center;color:#fff;position:relative;overflow:hidden;}
  @media (max-width:900px){ .app-cta{grid-template-columns:1fr;padding:36px 28px;} }
  .app-cta h2{color:#fff;font-size:2rem;font-weight:600;margin-bottom:16px;}
  .app-cta p{color:rgba(255,255,255,0.85);font-size:1.02rem;margin-bottom:28px;max-width:460px;}
  .app-feats{display:flex;flex-direction:column;gap:10px;}
  .app-feats div{display:flex;align-items:center;gap:10px;font-size:0.92rem;font-weight:600;}
  .phone-mock{background:var(--navy);border-radius:32px;padding:14px;box-shadow:0 30px 60px rgba(0,0,0,0.35);max-width:230px;margin:0 auto;}
  .phone-screen{background:var(--cream);border-radius:20px;padding:18px;}
  .phone-screen .ps-header{font-family:'Fraunces',serif;font-weight:700;color:var(--navy);font-size:0.85rem;margin-bottom:12px;}
  .phone-screen .ps-row{background:#fff;border-radius:10px;padding:10px 12px;margin-bottom:8px;font-size:0.72rem;color:var(--navy);font-weight:600;display:flex;justify-content:space-between;border:1px solid rgba(17,17,17,0.06);}
  .phone-screen .ps-row span.tag{color:var(--teal);}

  /* ── INSTRUCTOR ── */
  .instructor{display:grid;grid-template-columns:0.8fr 1.2fr;gap:56px;align-items:center;}
  @media (max-width:900px){ .instructor{grid-template-columns:1fr;} }
  .instructor-card{background:var(--ink);border-radius:22px;padding:34px 30px;color:#fff;}
  .instructor-card .ic-initials{width:64px;height:64px;border-radius:16px;background:var(--coral);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-weight:700;font-size:1.5rem;margin-bottom:20px;}
  .instructor-card .ic-name{font-family:'Fraunces',serif;font-size:1.4rem;font-weight:700;margin-bottom:3px;}
  .instructor-card .ic-role{color:var(--coral);font-size:0.85rem;font-weight:700;margin-bottom:22px;}
  .ic-stat{display:flex;justify-content:space-between;align-items:baseline;padding:12px 0;border-top:1px solid rgba(255,255,255,0.1);}
  .ic-stat .k{color:rgba(255,255,255,0.5);font-size:0.82rem;}
  .ic-stat .v{font-weight:700;font-size:0.9rem;}
  .instructor blockquote{font-family:'Fraunces',serif;font-size:1.5rem;color:var(--navy);line-height:1.4;font-weight:500;margin-bottom:22px;}
  .instructor .role{color:var(--coral);font-weight:700;margin-bottom:6px;}
  .instructor .name{font-size:1.3rem;color:var(--navy);font-weight:700;margin-bottom:16px;}
  .instructor .bio{color:var(--grey);}
  .cred-row{display:flex;gap:24px;margin-top:24px;flex-wrap:wrap;}
  .cred{display:flex;align-items:center;gap:10px;}
  .cred-icon{width:34px;height:34px;border-radius:10px;background:var(--gold-light);color:var(--coral-dark);display:flex;align-items:center;justify-content:center;font-size:0.9rem;}
  .cred span{font-size:0.85rem;font-weight:600;color:var(--navy);}

  /* ── REVIEWS ── */
  .reviews-strip{display:flex;gap:20px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none;}
  .reviews-strip::-webkit-scrollbar{display:none;}
  .review-card{flex:0 0 320px;background:var(--paper);border-radius:18px;padding:26px;border:1px solid rgba(17,17,17,0.08);}
  .review-stars{color:var(--gold);letter-spacing:2px;margin-bottom:14px;font-size:0.95rem;}
  .review-card p{color:var(--ink);font-size:0.93rem;margin-bottom:18px;}
  .reviewer{display:flex;align-items:center;gap:10px;}
  .reviewer-avatar{width:36px;height:36px;border-radius:50%;background:var(--coral-light);color:var(--coral-dark);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;}
  .reviewer .rn{font-weight:700;font-size:0.85rem;color:var(--navy);}
  .reviewer .rr{font-size:0.75rem;color:var(--grey);}

  /* ── FINAL CTA ── */
  .final-cta{background:var(--ink);border-radius:28px;padding:64px 40px;text-align:center;color:#fff;}
  .final-cta h2{color:#fff;font-size:2.2rem;font-weight:600;margin-bottom:16px;}
  .final-cta p{color:rgba(255,255,255,0.6);max-width:480px;margin:0 auto 32px;}
  .final-cta .btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}

  /* ── RESULTS ── */
  .results-band{background:var(--ink);border-radius:24px;padding:44px 36px;}
  .results-band h2{color:#fff;font-size:1.9rem;font-weight:600;margin-bottom:6px;}
  .results-band .rb-sub{color:rgba(255,255,255,0.55);font-size:0.95rem;margin-bottom:32px;}
  .results-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;}
  @media (max-width:900px){ .results-grid{grid-template-columns:repeat(3,1fr);} }
  @media (max-width:520px){ .results-grid{grid-template-columns:repeat(2,1fr);} }
  .result-chip{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:18px 12px;text-align:center;}
  .result-chip .score{font-family:'Fraunces',serif;font-size:1.9rem;font-weight:700;color:var(--coral);line-height:1;}
  .result-chip .band-lbl{font-size:0.7rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.05em;margin-top:6px;font-weight:700;}
  .result-chip .who{font-size:0.78rem;color:rgba(255,255,255,0.75);margin-top:5px;}
  .result-chip .exam{display:inline-block;margin-top:8px;background:rgba(219,106,12,0.2);color:var(--coral);font-size:0.62rem;font-weight:800;padding:3px 9px;border-radius:100px;letter-spacing:0.04em;}

  /* ── LEAD FORM ── */
  .lead-wrap{display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center;background:var(--paper);border:1.5px solid rgba(17,17,17,0.08);border-radius:24px;padding:44px;}
  @media (max-width:860px){ .lead-wrap{grid-template-columns:1fr;padding:30px 24px;gap:28px;} }
  .lead-wrap h2{font-size:1.9rem;color:var(--navy);font-weight:600;margin-bottom:12px;}
  .lead-wrap p{color:var(--grey);font-size:0.98rem;}
  .lead-perks{margin-top:22px;display:flex;flex-direction:column;gap:10px;}
  .lead-perks div{font-size:0.9rem;color:var(--ink);font-weight:600;display:flex;gap:9px;align-items:center;}
  .lead-form{display:flex;flex-direction:column;gap:12px;}
  .lead-form label{font-size:0.75rem;font-weight:700;color:var(--grey);text-transform:uppercase;letter-spacing:0.05em;}
  .lead-form input,.lead-form select{width:100%;padding:13px 15px;border:1.5px solid var(--grey-light);border-radius:12px;font-size:0.95rem;font-family:'Inter',sans-serif;color:var(--ink);background:#fff;}
  .lead-form input:focus,.lead-form select:focus{outline:none;border-color:var(--coral);}
  .lead-note{font-size:0.78rem;color:var(--grey);text-align:center;margin-top:4px;}

  /* ── FACTS GRID ── */
  .facts-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
  @media (max-width:900px){ .facts-grid{grid-template-columns:repeat(2,1fr);} }
  @media (max-width:520px){ .facts-grid{grid-template-columns:1fr;} }
  .fact-card{background:var(--paper);border:1px solid rgba(17,17,17,0.08);border-left:3px solid var(--coral);border-radius:14px;padding:20px;}
  .fact-card h4{font-size:0.97rem;color:var(--navy);font-weight:700;margin-bottom:6px;}
  .fact-card p{font-size:0.85rem;color:var(--grey);line-height:1.55;}

  /* ── BRANCHES ── */
  .branches-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:36px;}
  @media (max-width:700px){ .branches-grid{grid-template-columns:1fr;} }
  .branch-card{background:var(--paper);border:1.5px solid rgba(20,33,61,0.08);border-radius:16px;padding:24px;}
  .branch-name{font-weight:700;color:var(--navy);font-size:1.02rem;margin-bottom:10px;}
  .branch-card p{color:var(--grey);font-size:0.9rem;margin-bottom:14px;line-height:1.6;}
  .branch-phone{color:var(--coral);font-weight:700;font-size:0.92rem;}

  /* ── FOOTER ── */
  footer{padding:56px 0 32px;border-top:1px solid rgba(17,17,17,0.08);}
  .footer-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px;}
  @media (max-width:760px){ .footer-grid{grid-template-columns:1fr 1fr;} }
  .footer-grid h5{font-size:0.8rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--navy);margin-bottom:16px;font-weight:700;}
  .footer-grid a{display:block;color:var(--grey);font-size:0.9rem;margin-bottom:10px;}
  .footer-grid a:hover{color:var(--coral);}
  .footer-bottom{display:flex;justify-content:space-between;color:var(--grey);font-size:0.82rem;flex-wrap:wrap;gap:12px;}

'@
Set-Content -Path "app\globals.css" -Value $content -Encoding UTF8
Write-Host "  Wrote app\globals.css"

Write-Host ""
Write-Host "Done! All files created correctly." -ForegroundColor Green
Write-Host "Next, copy the 2 image files from the zip into public\images\ manually (instructor.jpg and ielts-classroom.jpg)."
Write-Host "Then run:"
Write-Host "  git add ."
Write-Host "  git commit -m 'Added About page, course detail pages, wired lead form to Sheet'"
Write-Host "  git push"