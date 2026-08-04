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
