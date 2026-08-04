import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Pioneer Education â€” Morinda, Punjab",
  description:
    "Pioneer Education Center was founded in 2017 by Narinder Singh in Prem Nagar, Morinda. TEFL-certified, 5.0â˜… rated, 125+ reviews. IELTS, PTE, Spoken English & German coaching.",
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
          <div className="eyebrow">Prem Nagar, Morinda Â· Since 2017</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "2.6rem", fontWeight: 600, color: "var(--navy)", lineHeight: 1.15, marginBottom: "18px" }}>
            Nine years of watching exactly where students lose marks.
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--grey)", maxWidth: "640px" }}>
            Pioneer Education Center opened in Prem Nagar, Morinda in 2017. What started as one instructor teaching IELTS
            has grown into a full teaching team covering IELTS, PTE, Spoken English, and German â€” while keeping the same
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
              approach rooted in pattern recognition â€” identifying exactly where each student&apos;s English breaks down,
              and fixing that specific gap rather than teaching generically. Today he leads a team of instructors
              delivering the same method across all four courses.
            </p>
            <div className="cred-row">
              <div className="cred"><div className="cred-icon">ðŸŽ“</div><span>TEFL Certified</span></div>
              <div className="cred"><div className="cred-icon">â­</div><span>5.0â˜… Google Rating</span></div>
              <div className="cred"><div className="cred-icon">ðŸ“</div><span>Prem Nagar, Morinda</span></div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head">
            <div className="section-eyebrow">How We're Different</div>
            <h2>Not a generic curriculum â€” a diagnosis-first approach.</h2>
            <p>
              Most institutes teach a fixed syllabus regardless of who's in the room. We've spent nearly a decade
              cataloguing the specific mistakes Punjabi-speaking students make in English and German, and built that
              directly into our lessons, our app, and our feedback style.
            </p>
          </div>
          <div className="facts-grid">
            <div className="fact-card">
              <h4>â° 4â€“5 hours daily</h4>
              <p>Intensive classes from 9 AM to 1 PM, with evening batches for working students.</p>
            </div>
            <div className="fact-card">
              <h4>ðŸ‘¤ Max 8 per batch</h4>
              <p>Small batches by design, so every student gets real speaking time and attention.</p>
            </div>
            <div className="fact-card">
              <h4>ðŸ“Š 3-level material</h4>
              <p>Beginner, Intermediate, and Advanced â€” you start where you actually are, not where a syllabus assumes.</p>
            </div>
            <div className="fact-card">
              <h4>ðŸ“ Weekly mock tests</h4>
              <p>Every Friday, with detailed written feedback so progress is tracked, not just assumed.</p>
            </div>
            <div className="fact-card">
              <h4>ðŸ’¬ Daily app practice</h4>
              <p>The Lexio app extends every class into daily vocabulary, grammar, and pronunciation practice.</p>
            </div>
            <div className="fact-card">
              <h4>ðŸ‡©ðŸ‡ª Beyond English</h4>
              <p>The same structured, pattern-based method applied to German A1â€“B1 for visa and study applicants.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="final-cta">
            <h2>Come see it for yourself.</h2>
            <p>Book a free demo class in Prem Nagar, Morinda â€” no payment, no commitment.</p>
            <div className="btns">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-coral">Message Us on WhatsApp</a>
              <Link href="/#demo" className="btn" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)" }}>Book Free Demo</Link>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap footer-bottom">
          <div>Â© 2026 Pioneer Education Center. All rights reserved.</div>
          <Link href="/" style={{ color: "var(--coral)", fontWeight: 700 }}>â† Back to homepage</Link>
        </div>
      </footer>
    </>
  );
}

