"use client";
import Link from "next/link";

export default function GTHome() {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f1e9", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <header style={{ borderBottom: "3px double #1b2420", padding: "28px 24px 18px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.22em", fontSize: 11, textTransform: "uppercase", color: "#a8472e", marginBottom: 8 }}>
          General Training
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "clamp(28px,4vw,40px)", margin: "0 0 6px", color: "#1b2420" }}>
          Choose Your Task
        </h1>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#4a4538", margin: 0, fontSize: 15 }}>
          Select Task 1 or Task 2 to begin
        </p>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          <Link href="/writing-analyzer/gt/task1" style={{ textDecoration: "none" }}>
            <div style={{ background: "#fffdf7", border: "1px solid #cfc8b4", padding: "36px 24px", textAlign: "center", boxShadow: "0 6px 18px rgba(0,0,0,0.05)", cursor: "pointer" }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>✉️</div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "#1b2420", margin: "0 0 6px" }}>Task 1 — Letter</h2>
              <p style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: "#7a7259", margin: 0 }}>20 MIN · 150 WORDS MIN</p>
              <div style={{ marginTop: 18, fontFamily: "'Courier New', monospace", fontSize: 12, color: "#a8472e", textTransform: "uppercase" }}>Start →</div>
            </div>
          </Link>

          <Link href="/writing-analyzer/gt/task2" style={{ textDecoration: "none" }}>
            <div style={{ background: "#fffdf7", border: "1px solid #cfc8b4", padding: "36px 24px", textAlign: "center", boxShadow: "0 6px 18px rgba(0,0,0,0.05)", cursor: "pointer" }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>📝</div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "#1b2420", margin: "0 0 6px" }}>Task 2 — Essay</h2>
              <p style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: "#7a7259", margin: 0 }}>40 MIN · 250 WORDS MIN</p>
              <div style={{ marginTop: 18, fontFamily: "'Courier New', monospace", fontSize: 12, color: "#a8472e", textTransform: "uppercase" }}>Start →</div>
            </div>
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/writing-analyzer" style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#8a8266", textDecoration: "none", textTransform: "uppercase" }}>
            ← Back
          </Link>
        </div>
      </div>
    </div>
  );
}