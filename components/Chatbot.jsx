"use client";
import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = ["Course fees?", "Online classes available?", "IELTS coaching details", "German course info", "Free demo class?", "Batch timings?"];
const WA = "https://wa.me/917380261308?text=Hi!%20I%20want%20to%20know%20more%20about%20Pioneer%20Education";
const G = "#1a6b45", GOLD = "#c9a227";
const SHEET_URL = "https://script.google.com/macros/s/AKfycbwExqnIZvubS7LLWU6ZgNdK73GJDI3jY0fwhLyMlDtNorIfGwotRdRl17wEJX5U9dVYJQ/exec";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("IELTS");
  const [err, setErr] = useState("");
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "Hi! I am the Pioneer Education assistant. Ask me anything about our courses, fees, or free demo class!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bubble, setBubble] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);
  useEffect(() => { const t = setTimeout(() => setOpen(true), 5000); return () => clearTimeout(t); }, []);

  const submitForm = async () => {
    if (!name.trim()) { setErr("Please enter your name."); return; }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) { setErr("Enter valid 10-digit mobile number."); return; }
    try {
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), course }),
      });
    } catch(e) { console.log("Sheet error:", e); }
    setStep("chat");
  };

  const send = async (text) => {
    const t = text || input.trim();
    if (!t || loading) return;
    setInput("");
    const updated = [...msgs, { role: "user", content: t }];
    setMsgs(updated);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMsgs([...updated, { role: "assistant", content: data.reply || "Sorry, please try again." }]);
    } catch {
      setMsgs([...updated, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
        {bubble && !open && (
          <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "16px 16px 4px 16px", padding: "10px 14px", fontSize: 13, color: "#222", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", maxWidth: 200, cursor: "pointer", position: "relative" }} onClick={() => { setOpen(true); setBubble(false); }}>
            Hi! Have questions about our courses?
            <button onClick={e => { e.stopPropagation(); setBubble(false); }} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#999", border: "none", color: "#fff", fontSize: 10, cursor: "pointer" }}>x</button>
          </div>
        )}
        <button onClick={() => { setOpen(!open); setBubble(false); }} style={{ width: 60, height: 60, borderRadius: "50%", background: G, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 4px 20px rgba(26,107,69,0.4)" }}>
          {open ? "x" : "??"}
        </button>
      </div>
      {open && (
        <div style={{ position: "fixed", bottom: 96, right: 24, zIndex: 999, width: 360, borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", fontFamily: "sans-serif", border: "1px solid #e0e0e0" }}>
          <div style={{ background: G, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>??</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Pioneer Education Assistant</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>IELTS - PTE - English - German</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#a0f0c0" }} />
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>Online</span>
            </div>
          </div>
          {step === "form" ? (
            <div style={{ padding: 20, background: "#f7f9fc" }}>
              <p style={{ fontSize: 13, color: "#555", marginBottom: 14 }}>Enter your details to start chatting</p>
              <input placeholder="Your Name *" value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, marginBottom: 10, boxSizing: "border-box" }} />
              <input placeholder="Mobile Number *" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/, ""))} maxLength={10} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, marginBottom: 10, boxSizing: "border-box" }} />
              <select value={course} onChange={e => setCourse(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, marginBottom: 10, boxSizing: "border-box", background: "#fff" }}>
                <option>IELTS</option><option>PTE</option><option>Spoken English</option><option>German A1-B1</option><option>Not decided yet</option>
              </select>
              {err && <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>{err}</div>}
              <button onClick={submitForm} style={{ width: "100%", background: G, color: "#fff", border: "none", borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Start Chat</button>
            </div>
          ) : (
            <>
              <div style={{ height: 300, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 10, background: "#f7f9fc" }}>
                {msgs.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                    {m.role === "assistant" && <div style={{ width: 24, height: 24, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, marginRight: 6, flexShrink: 0, alignSelf: "flex-end" }}>??</div>}
                    <div style={{ maxWidth: "78%", padding: "8px 12px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? G : "#fff", color: m.role === "user" ? "#fff" : "#222", fontSize: 13, lineHeight: 1.6, border: m.role === "user" ? "none" : "1px solid #e8e8e8" }}>{m.content}</div>
                  </div>
                ))}
                {loading && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 24, height: 24, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>??</div><div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "14px 14px 14px 4px", padding: "9px 13px" }}>...</div></div>}
                {msgs.length === 1 && !loading && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>Quick questions:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {SUGGESTIONS.map((s, i) => <button key={i} onClick={() => send(s)} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 20, border: "1px solid #1a6b45", background: "#fff", color: "#1a6b45", cursor: "pointer" }}>{s}</button>)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div style={{ padding: "6px 12px", background: "#e9fdf1", borderTop: "1px solid #b2f0ce", display: "flex", justifyContent: "center" }}>
                <a href={WA} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#075e54", fontSize: 12, fontWeight: 600 }}>WhatsApp: +91 73802 61308</a>
              </div>
              <div style={{ padding: "9px 12px", background: "#fff", borderTop: "1px solid #eee", display: "flex", gap: 8, alignItems: "center" }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==="Enter"){e.preventDefault();send();}}} placeholder="Ask about courses, fees, timings..." style={{ flex: 1, padding: "8px 12px", borderRadius: 22, border: "1px solid #ddd", fontSize: 13, outline: "none", background: "#f7f9fc" }} />
                <button onClick={() => send()} disabled={!input.trim()||loading} style={{ width: 36, height: 36, borderRadius: "50%", background: input.trim()&&!loading ? G : "#eee", border: "none", cursor: "pointer" }}>?</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
