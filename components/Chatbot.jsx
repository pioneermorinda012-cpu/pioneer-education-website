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
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "?? Hi! I am the Pioneer Education assistant. Ask me anything about our courses, fees, or free demo class!" }]);
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

  return <div>Chatbot loading...</div>;
}
