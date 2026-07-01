"use client";
import Link from "next/link";

export default function GTTask2() {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f1e9", fontFamily: "Arial, sans-serif", padding: "40px 20px" }}>
      <h1 style={{ textAlign: "center" }}>GT Task 2 — Essay</h1>
      <p style={{ textAlign: "center", color: "#555" }}>Coming soon</p>
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <Link href="/writing-analyzer/gt" style={{ color: "#1b2420" }}>← Back</Link>
      </div>
    </div>
  );
}