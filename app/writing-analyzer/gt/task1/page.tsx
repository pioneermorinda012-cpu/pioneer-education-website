"use client";
import Link from "next/link";

export default function AcademicTask1() {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f1e9", fontFamily: "Arial, sans-serif", padding: "40px 20px" }}>
      <h1 style={{ textAlign: "center" }}>Academic Task 1 — Graph/Chart Description</h1>
      <p style={{ textAlign: "center", color: "#555" }}>Coming soon</p>
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <Link href="/writing-analyzer/academic" style={{ color: "#1b2420" }}>← Back</Link>
      </div>
    </div>
  );
}