"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STOPWORDS = new Set("the a an and or but if of to in on at for with as by from is are was were be been being this that these those it its i you he she we they my your his her our their not no so very can could will would should may might do does did have has had".split(" "));

function words(text: string): string[] { return text.trim().match(/[A-Za-z']+/g) || []; }
function sentences(text: string): string[] { return text.trim().match(/[^.!?]+[.!?]+/g) || (text.trim() ? [text.trim()] : []); }
function paragraphs(text: string): string[] { return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean); }

const FORMAL_OPENERS = ["dear sir","dear madam","dear mr","dear mrs","dear ms","to whom it may concern"];
const INFORMAL_OPENERS = ["dear","hi","hello","hey"];
const FORMAL_CLOSERS = ["yours sincerely","yours faithfully","kind regards","best regards","yours truly"];
const INFORMAL_CLOSERS = ["best wishes","take care","love","cheers","regards","bye","looking forward"];
const POLITE_PHRASES = ["i would like to","i am writing to","i would be grateful","i would appreciate","please could you","i am afraid","i regret to","i wish to","i would be happy to","i look forward to","i hope","thank you for"];
const REQUEST_PHRASES = ["could you","would you","please","i would like","i request","i am requesting","kindly"];
const APOLOGY_PHRASES = ["i apologise","i apologize","i am sorry","i regret","please accept my","on behalf of"];
const COMPLAINT_PHRASES = ["i am writing to complain","i am dissatisfied","i was disappointed","i am not satisfied","the service was","the product was","i would like to draw your attention"];
const COMPLEX_MARKERS = ["because","although","though","while","whereas","if","unless","since","which","who","that","as","even though","provided that","however","moreover","furthermore","therefore"];

function uniqueWordRatio(ws: string[]) {
  const lower = ws.map(w => w.toLowerCase());
  const content = lower.filter(w => !STOPWORDS.has(w) && w.length > 2);
  if (content.length === 0) return { ttr: 0 };
  return { ttr: new Set(content).size / content.length };
}
function countOccurrences(text: string, list: string[]) {
  const t = text.toLowerCase();
  let n = 0; const found: string[] = [];
  list.forEach(l => {
    const re = new RegExp("\\b" + l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\b", "gi");
    const m = t.match(re);
    if (m) { n += m.length; found.push(l); }
  });
  return { n, found };
}
function round5(x: number) { return Math.round(x * 2) / 2; }
function clampBand(x: number) { return Math.min(9, Math.max(2.5, x)); }
function bandLabel(b: number) {
  if (b >= 8.5) return "Expert"; if (b >= 7.5) return "Very Good"; if (b >= 6.5) return "Good";
  if (b >= 5.5) return "Competent"; if (b >= 4.5) return "Modest"; return "Limited";
}

function detectTone(text: string): "formal" | "informal" | "semi-formal" | "unknown" {
  const t = text.toLowerCase();
  const hasFormalOpener = FORMAL_OPENERS.some(o => t.includes(o));
  const hasFormalCloser = FORMAL_CLOSERS.some(c => t.includes(c));
  const hasInformalCloser = INFORMAL_CLOSERS.some(c => t.includes(c));
  if (hasFormalOpener && hasFormalCloser) return "formal";
  if (hasFormalOpener && hasInformalCloser) return "semi-formal";
  if (!hasFormalOpener && hasInformalCloser) return "informal";
  return "unknown";
}

function analyzeTask1(text: string) {
  const ws = words(text);
  const wc = ws.length;
  const sents = sentences(text);
  const sc = sents.length || 1;
  const paras = paragraphs(text);
  const { ttr } = uniqueWordRatio(ws);
  const tone = detectTone(text);
  const lowerText = text.toLowerCase();
  const politeInfo = countOccurrences(text, POLITE_PHRASES);
  const requestInfo = countOccurrences(text, REQUEST_PHRASES);
  const complexInfo = countOccurrences(text, COMPLEX_MARKERS);
  const apologyInfo = countOccurrences(text, APOLOGY_PHRASES);
  const complaintInfo = countOccurrences(text, COMPLAINT_PHRASES);
  const hasFormalOpener = FORMAL_OPENERS.some(o => lowerText.includes(o));
  const hasFormalCloser = FORMAL_CLOSERS.some(c => lowerText.includes(c));
  const hasInformalCloser = INFORMAL_CLOSERS.some(c => lowerText.includes(c));

  let tr = 6.5; const trFb: {t: string; m: string}[] = [];
  if (wc < 100) { tr -= 2; trFb.push({ t: "bad", m: `Only ${wc} words — well under the 150-word minimum.` }); }
  else if (wc < 150) { tr -= 1; trFb.push({ t: "bad", m: `${wc} words — under the 150-word minimum. Aim for 160–180.` }); }
  else { trFb.push({ t: "good", m: `Word count (${wc}) meets the minimum requirement.` }); }

  if (hasFormalOpener) { trFb.push({ t: "good", m: `Appropriate formal opening detected.` }); }
  else { tr -= 0.5; trFb.push({ t: "bad", m: "No formal opening detected (e.g. 'Dear Sir/Madam', 'Dear Mr Smith')." }); }

  if (hasFormalCloser) { trFb.push({ t: "good", m: "Appropriate formal closing detected (e.g. 'Yours sincerely')." }); }
  else if (hasInformalCloser) { trFb.push({ t: "tip", m: "Informal closing detected — ensure it matches your letter's tone." }); }
  else { tr -= 0.5; trFb.push({ t: "bad", m: "No closing phrase detected. End with 'Yours sincerely' or 'Best wishes'." }); }

  if (paras.length >= 3) { trFb.push({ t: "good", m: `${paras.length} paragraphs — good structure for a letter.` }); }
  else { tr -= 0.5; trFb.push({ t: "bad", m: `Only ${paras.length} paragraph(s). A letter needs opening, body points, and closing.` }); }

  if (politeInfo.n >= 2 || requestInfo.n >= 2) { trFb.push({ t: "good", m: `Polite/request language present (e.g. ${[...politeInfo.found, ...requestInfo.found].slice(0,3).join(", ")}).` }); }
  else { tr -= 0.5; trFb.push({ t: "tip", m: "Add more polite language: 'I would like to', 'I would be grateful if', 'Could you please'." }); }

  if (apologyInfo.n > 0) { trFb.push({ t: "good", m: "Apology language detected — suitable for complaint or apology letters." }); }
  if (complaintInfo.n > 0) { trFb.push({ t: "good", m: "Complaint framing detected." }); }
  tr = round5(clampBand(tr));

  let cc = 6.5; const ccFb: {t: string; m: string}[] = [];
  const toneLabel = tone === "unknown" ? "unclear" : tone;
  if (tone === "formal") { ccFb.push({ t: "good", m: "Tone is consistently formal — appropriate for official/complaint letters." }); }
  else if (tone === "informal") { ccFb.push({ t: "good", m: "Tone is consistently informal — appropriate for letters to friends/family." }); }
  else { cc -= 0.5; ccFb.push({ t: "tip", m: `Tone is ${toneLabel} — ensure your opening and closing match throughout.` }); }

  if (paras.length >= 3) { ccFb.push({ t: "good", m: "Clear paragraph structure." }); }
  else { cc -= 0.5; ccFb.push({ t: "bad", m: "Improve paragraph organisation." }); }

  if (complexInfo.n >= 3) { ccFb.push({ t: "good", m: `Good use of linking/connective language (${complexInfo.found.slice(0,3).join(", ")}).` }); }
  else { cc -= 0.5; ccFb.push({ t: "tip", m: "Use more connective words: however, moreover, therefore, because." }); }
  cc = round5(clampBand(cc));

  let lr = 6.5; const lrFb: {t: string; m: string}[] = [];
  if (ttr > 0.75) { lrFb.push({ t: "good", m: `Good vocabulary range (${(ttr * 100).toFixed(0)}% unique).` }); }
  else if (ttr > 0.6) { lr -= 0.5; lrFb.push({ t: "tip", m: `Moderate vocabulary range (${(ttr * 100).toFixed(0)}% unique).` }); }
  else { lr -= 1; lrFb.push({ t: "bad", m: `Limited vocabulary range (${(ttr * 100).toFixed(0)}% unique) — avoid repeating the same words.` }); }

  const informalCount = (text.match(/\b(stuff|things|a lot of|kids|guys|gonna|wanna|kinda|sorta)\b/gi) || []).length;
  if (tone === "formal" && informalCount > 0) { lr -= 0.5; lrFb.push({ t: "bad", m: `${informalCount} informal word(s) in a formal letter — replace with precise vocabulary.` }); }
  if (politeInfo.n >= 3) { lrFb.push({ t: "good", m: "Good range of polite/formal expressions." }); }
  lr = round5(clampBand(lr));

  let gra = 6.5; const graFb: {t: string; m: string}[] = [];
  if (complexInfo.n >= 5) { graFb.push({ t: "good", m: `Strong range of sentence structures (${complexInfo.n} complex markers).` }); }
  else if (complexInfo.n >= 2) { gra -= 0.5; graFb.push({ t: "tip", m: "Increase sentence variety — use although, despite, which, who etc." }); }
  else { gra -= 1; graFb.push({ t: "bad", m: "Sentences appear too simple. Use complex structures to improve the score." }); }
  if (sc >= 6) { graFb.push({ t: "good", m: `${sc} sentences — sufficient for variety.` }); }
  else { gra -= 0.5; graFb.push({ t: "tip", m: "Write more sentences to demonstrate grammatical range." }); }
  gra = round5(clampBand(gra));

  const overall = round5((tr + cc + lr + gra) / 4);
  return { wc, sc, paras: paras.length, tone, tr, cc, lr, gra, overall, trFb, ccFb, lrFb, graFb };
}

function FbList({ arr }: { arr: {t: string; m: string}[] }) {
  return <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
    {arr.map((f, i) => (
      <li key={i} style={{ padding: "6px 0 6px 22px", position: "relative", fontSize: 13.5 }}>
        <span style={{ position: "absolute", left: f.t === "bad" ? 2 : 0, color: f.t === "good" ? "#3c6e4f" : f.t === "bad" ? "#a8472e" : "#b08a3e", fontWeight: "bold" }}>
          {f.t === "good" ? "✓" : f.t === "bad" ? "!" : "→"}
        </span>{f.m}
      </li>
    ))}
  </ul>;
}

function Timer({ minutes }: { minutes: number }) {
  const [remaining, setRemaining] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const total = minutes * 60;
  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) { setRunning(false); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [running, remaining]);
  const m = Math.floor(remaining / 60), s = remaining % 60;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "flex-end", padding: "0 20px 0 26px" }}>
      <button onClick={() => { setRunning(false); setRemaining(total); }} style={{ fontFamily: "'Courier New', monospace", fontSize: 11, textTransform: "uppercase", background: "transparent", border: "1px solid #cfc8b4", color: "#8a8266", padding: "6px 12px", cursor: "pointer" }}>Reset</button>
      <button onClick={() => setRunning(r => !r)} style={{ fontFamily: "'Courier New', monospace", fontSize: 11, textTransform: "uppercase", background: "transparent", border: "1px solid #1b2420", color: "#1b2420", padding: "6px 12px", cursor: "pointer" }}>{running ? "Pause" : "Start"}</button>
      <div style={{ fontFamily: "'Courier New', monospace", fontSize: 22, fontWeight: "bold", color: remaining <= 120 ? "#a8472e" : "#1b2420", minWidth: 64, textAlign: "right" }}>{m}:{s.toString().padStart(2, "0")}</div>
    </div>
  );
}

export default function GTTask1Page() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ReturnType<typeof analyzeTask1> | null>(null);

  const analyze = () => {
    if (words(text).length < 10) { alert("Please write at least 10 words before analyzing."); return; }
    setResult(analyzeTask1(text));
    setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f1e9", fontFamily: "'Helvetica Neue', Arial, sans-serif", color: "#1b2420" }}>
      <header style={{ borderBottom: "3px double #1b2420", padding: "28px 24px 18px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.22em", fontSize: 11, textTransform: "uppercase", color: "#a8472e", marginBottom: 8 }}>General Training · Task 1</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "clamp(26px,4vw,40px)", margin: "0 0 6px" }}>Letter Writing</h1>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#4a4538", margin: 0, fontSize: 14 }}>Paste your letter below for a band-by-band breakdown</p>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "30px 20px 70px" }}>
        <div style={{ background: "#fffdf7", border: "1px solid #cfc8b4", boxShadow: "0 6px 18px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 20px 10px 26px", borderBottom: "1px solid #cfc8b4" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 19, margin: 0 }}>Your Letter</h2>
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: "#7a7259" }}>20 MIN · 150 WORDS MIN</span>
          </div>
          <Timer minutes={20} />
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={"Dear Sir/Madam,\n\nI am writing to...\n\nYours faithfully,\n[Your name]"} style={{ width: "100%", minHeight: 280, border: "none", resize: "vertical", padding: "16px 20px 16px 26px", fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.65, background: "transparent", color: "#1b2420", outline: "none", boxSizing: "border-box" }} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 20px 14px 26px", fontFamily: "'Courier New', monospace", fontSize: 11, color: "#8a8266" }}>
            <span>Words: <b>{words(text).length}</b></span>
            <span>Sentences: <b>{sentences(text).length}</b></span>
          </div>
        </div>

        <div style={{ textAlign: "center", margin: "32px 0" }}>
          <button onClick={analyze} style={{ fontFamily: "'Courier New', monospace", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: 13, background: "#1b2420", color: "#f4f1e9", border: "none", padding: "15px 38px", cursor: "pointer" }}>Analyze My Letter</button>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "#7a7259", marginTop: 10 }}>Estimates are based on official IELTS band descriptors — informed approximation, not a certified score.</div>
        </div>

        {result && (
          <div id="results">
            <div style={{ textAlign: "center", padding: "36px 20px", marginBottom: 30, background: "#1b2420", color: "#f4f1e9" }}>
              <div style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.2em", fontSize: 11, color: "#b08a3e", textTransform: "uppercase" }}>Estimated Band Score</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(56px,9vw,80px)", fontWeight: 700, lineHeight: 1, margin: "6px 0" }}>{result.overall.toFixed(1)}</div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#cfc8b4" }}>{result.wc} words · Tone: {result.tone}</div>
            </div>
            <div style={{ background: "#fffdf7", border: "1px solid #cfc8b4" }}>
              <div style={{ padding: "18px 26px", borderBottom: "3px double #1b2420", background: "#eae5d8" }}>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: 0 }}>Letter Report</h3>
              </div>
              {([["Task Achievement", result.tr, result.trFb], ["Coherence & Cohesion", result.cc, result.ccFb], ["Lexical Resource", result.lr, result.lrFb], ["Grammatical Range & Accuracy", result.gra, result.graFb]] as [string, number, {t:string;m:string}[]][]).map(([title, score, fb], i) => (
                <div key={i} style={{ borderBottom: "1px solid #cfc8b4", padding: "18px 26px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ fontFamily: "Georgia, serif", fontSize: 16.5, margin: 0 }}>{title}</h4>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 15, fontWeight: "bold", background: "#3c5e4e", color: "#fff", padding: "3px 11px", borderRadius: 2 }}>{score.toFixed(1)} · {bandLabel(score)}</div>
                  </div>
                  <div style={{ marginTop: 12 }}><FbList arr={fb} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/writing-analyzer/gt" style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#8a8266", textDecoration: "none", textTransform: "uppercase" }}>← Back to Task Selection</Link>
        </div>
      </div>
    </div>
  );
}
