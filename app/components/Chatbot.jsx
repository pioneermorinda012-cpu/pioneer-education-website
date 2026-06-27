"use client";
import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = ["Course fees?", "Online classes available?", "IELTS coaching details", "German course info", "Free demo class?", "Batch timings?"];
const WA = "https://wa.me/917380261308?text=Hi!%20I%20want%20to%20know%20more%20about%20Pioneer%20Education";

export default function Chatbot() {
  const [step, setStep] = useState("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("IELTS");
  const [err, setErr] = useState("");
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "👋 Hi! I'm the Pioneer Education assistant. Ask me anything about our courses, fees, or free demo class!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const submitForm = () => {
    if (!name.trim()) { setErr("Please enter your name."); return; }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) { setErr("Enter valid 10-digit mobile number."); return; }
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
      // ✅ Calls YOUR secure API route — API key never exposed to browser
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

  const G = "#1a6b45", GOLD = "#c9a227";

  return (
    <div style={{ border: "1px solid #e0e0e0", borderRadius: 16, overflow: "hidden", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ background: G, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎓</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Pioneer Education Assistant</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>IELTS • PTE • English • German</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#a0f0c0" }} />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>Online</span>
        </div>
      </div>

      {step === "form" ? (
        <div style={{ padding: 24, background: "#f7f9fc" }}>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>Enter your details to start chatting 👇</p>
          <input placeholder="Your Name *" value={name} onChange={e => setName(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, marginBottom: 10, boxSizing: "border-box" }} />
          <input placeholder="Mobile Number *" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/, ""))} maxLength={10}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, marginBottom: 10, boxSizing: "border-box" }} />
          <select value={course} onChange={e => setCourse(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, marginBottom: 10, boxSizing: "border-box", background: "#fff" }}>
            <option>IELTS</option><option>PTE</option><option>Spoken English</option><option>German A1–B1</option><option>Not decided yet</option>
          </select>
          {err && <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>{err}</div>}
          <button onClick={submitForm} style={{ width: "100%", background: G, color: "#fff", border: "none", borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Start Chat →</button>
        </div>
      ) : (
        <>
          <div style={{ height: 340, overflowY: "auto", padding: "12px 12px", display: "flex", flexDirection: "column", gap: 10, background: "#f7f9fc" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "assistant" && <div style={{ width: 24, height: 24, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, marginRight: 6, flexShrink: 0, alignSelf: "flex-end" }}>🎓</div>}
                <div style={{ maxWidth: "74%", padding: "8px 12px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? G : "#fff", color: m.role === "user" ? "#fff" : "#222", fontSize: 13, lineHeight: 1.6, border: m.role === "user" ? "none" : "1px solid #e8e8e8", whiteSpace: "pre-wrap" }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🎓</div>
                <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "14px 14px 14px 4px", padding: "9px 13px", display: "flex", gap: 4 }}>
                  {[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: G, animation: `pe-bounce 1s ${d*0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            {msgs.length === 1 && !loading && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>Quick questions:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {SUGGESTIONS.map((s, i) => <button key={i} onClick={() => send(s)} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 20, border: `1px solid ${G}`, background: "#fff", color: G, cursor: "pointer" }}>{s}</button>)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: "6px 12px", background: "#e9fdf1", borderTop: "1px solid #b2f0ce", display: "flex", justifyContent: "center" }}>
            <a href={WA} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, textDecoration: "none", color: "#075e54", fontSize: 12, fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enroll / Chat · +91 73802 61308
            </a>
          </div>
          <div style={{ padding: "9px 12px", background: "#fff", borderTop: "1px solid #eee", display: "flex", gap: 8, alignItems: "center" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==="Enter"){e.preventDefault();send();}}}
              placeholder="Ask about courses, fees, timings..."
              style={{ flex: 1, padding: "8px 12px", borderRadius: 22, border: "1px solid #ddd", fontSize: 13, outline: "none", background: "#f7f9fc" }} />
            <button onClick={() => send()} disabled={!input.trim()||loading}
              style={{ width: 36, height: 36, borderRadius: "50%", background: input.trim()&&!loading ? G : "#eee", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={input.trim()&&!loading?"#fff":"#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </>
      )}
      <style>{`@keyframes pe-bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}