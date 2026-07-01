"use client";
import Link from "next/link";

export default function WritingAnalyzerHome() {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f1e9", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <header style={{ borderBottom: "3px double #1b2420", padding: "28px 24px 18px", textAlign: "center", background: "#f4f1e9" }}>
        <div style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.22em", fontSize: 11, textTransform: "uppercase", color: "#a8472e", marginBottom: 8 }}>
          Self-Assessment Instrument
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "clamp(28px,4vw,44px)", margin: "0 0 6px", color: "#1b2420" }}>
          IELTS Writing Examiner's Desk
        </h1>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#4a4538", margin: 0, fontSize: 15 }}>
          Choose your test type to begin practice
        </p>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          <Link href="/writing-analyzer/gt" style={{ textDecoration: "none" }}>
            <div style={{ background: "#fffdf7", border: "1px solid #cfc8b4", padding: "40px 28px", textAlign: "center", boxShadow: "0 6px 18px rgba(0,0,0,0.05)", transition: "transform 0.2s", cursor: "pointer" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#1b2420", margin: "0 0 8px" }}>General Training</h2>
              <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#7a7259", fontSize: 13, margin: 0 }}>
                Task 1: Letter Writing · Task 2: Essay
              </p>
              <div style={{ marginTop: 20, fontFamily: "'Courier New', monospace", fontSize: 12, color: "#a8472e", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Enter →
              </div>
            </div>
          </Link>

          <Link href="/writing-analyzer/academic" style={{ textDecoration: "none" }}>
            <div style={{ background: "#fffdf7", border: "1px solid #cfc8b4", padding: "40px 28px", textAlign: "center", boxShadow: "0 6px 18px rgba(0,0,0,0.05)", transition: "transform 0.2s", cursor: "pointer" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#1b2420", margin: "0 0 8px" }}>Academic</h2>
              <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#7a7259", fontSize: 13, margin: 0 }}>
                Task 1: Report/Graph · Task 2: Essay
              </p>
              <div style={{ marginTop: 20, fontFamily: "'Courier New', monospace", fontSize: 12, color: "#a8472e", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Enter →
              </div>
            </div>
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: 50 }}>
          <Link href="/" style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#8a8266", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            ← Back to Pioneer Education
          </Link>
        </div>
      </div>

      <footer style={{ textAlign: "center", padding: 26, fontFamily: "'Courier New', monospace", fontSize: 10.5, color: "#9a9277", letterSpacing: "0.06em", borderTop: "1px solid #cfc8b4" }}>
        Heuristic engine runs entirely in your browser — no text is uploaded anywhere.
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "#7a7259", paddingTop: 6 }}>
          Treat this as a practice companion. For an official score, sit a real IELTS test or consult a qualified examiner.
        </div>
      </footer>
    </div>
  );
}