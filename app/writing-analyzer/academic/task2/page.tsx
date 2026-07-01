"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STOPWORDS = new Set("the a an and or but if of to in on at for with as by from is are was were be been being this that these those it its i you he she we they my your his her our their not no so very can could will would should may might do does did have has had".split(" "));
function words(text) { return (text.trim().match(/[A-Za-z'']+/g) || []); }
function sentences(text) { return (text.trim().match(/[^.!?]+[.!?]+/g) || (text.trim() ? [text.trim()] : [])); }
function paragraphs(text) { return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean); }

const LINKERS = ["however","moreover","furthermore","in addition","additionally","on the other hand","therefore","consequently","as a result","for example","for instance","in conclusion","to conclude","overall","in summary","firstly","secondly","finally","in contrast","despite","although","while","whereas","nevertheless","nonetheless","besides","similarly","likewise","thus","hence","in particular","specifically","to illustrate"];
const COMPLEX_MARKERS = ["because","although","though","while","whereas","if","unless","since","which","who","whom","that","whenever","wherever","despite","in spite of","even though","provided that","as long as"];
const PASSIVE_RE = /\b(is|are|was|were|been|being|be)\s+\w+ed\b/gi;

function uniqueWordRatio(ws) {
  const lower = ws.map(w => w.toLowerCase());
  const content = lower.filter(w => !STOPWORDS.has(w) && w.length > 2);
  if (content.length === 0) return { ttr: 0, content: [] };
  const set = new Set(content);
  return { ttr: set.size / content.length, content };
}
function overusedWords(ws) {
  const lower = ws.map(w => w.toLowerCase()).filter(w => !STOPWORDS.has(w) && w.length > 3);
  const counts = {};
  lower.forEach(w => counts[w] = (counts[w] || 0) + 1);
  const total = lower.length || 1;
  return Object.entries(counts).filter(([w, c]) => c >= 4 && (c / total) > 0.025).sort((a, b) => b[1] - a[1]).slice(0, 5);
}
function countOccurrences(text, list) {
  const t = text.toLowerCase();
  let n = 0; let found = [];
  list.forEach(l => {
    const re = new RegExp("\\b" + l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\b", "gi");
    const m = t.match(re);
    if (m) { n += m.length; found.push(l); }
  });
  return { n, found };
}
function round5(x) { return Math.round(x * 2) / 2; }
function clampBand(x) { return Math.min(9, Math.max(2.5, x)); }
function band5label(b) {
  if (b >= 8.5) return "Expert"; if (b >= 7.5) return "Very Good"; if (b >= 6.5) return "Good";
  if (b >= 5.5) return "Competent"; if (b >= 4.5) return "Modest"; return "Limited";
}

function analyzeTask2(text, prompt) {
  const ws = words(text);
  const wc = ws.length;
  const sents = sentences(text);
  const sc = sents.length || 1;
  const paras = paragraphs(text);
  const avgSentLen = wc / sc;
  const { ttr, content } = uniqueWordRatio(ws);
  const overused = overusedWords(ws);
  const linkerInfo = countOccurrences(text, LINKERS);
  const complexInfo = countOccurrences(text, COMPLEX_MARKERS);
  const lowerText = text.toLowerCase();
  const hasOpinionMarker = /(i (strongly )?(believe|think|agree|disagree)|in my (opinion|view)|this essay (will|argues)|it is my view)/.test(lowerText);
  const hasConclusionMarker = /(in conclusion|to conclude|to sum up|overall,|in summary)/.test(lowerText);
  const passiveCount = (text.match(PASSIVE_RE) || []).length;

  let tr = 6.5; const trFb = [];
  if (wc < 180) { tr -= 2; trFb.push({ t: "bad", m: `Only ${wc} words — significantly under the 250-word minimum. Capped at Band 5 or below.` }); }
  else if (wc < 250) { tr -= 1; trFb.push({ t: "bad", m: `${wc} words is under the 250-word minimum; aim for 270–320.` }); }
  else if (wc > 400) { trFb.push({ t: "tip", m: `${wc} words — long. Make sure length comes from development, not repetition.` }); }
  else { trFb.push({ t: "good", m: `Length (${wc} words) is appropriate for Task 2.` }); }

  if (paras.length < 4) { tr -= 0.5; trFb.push({ t: "bad", m: `Only ${paras.length} paragraph(s) — need intro, 2 body paragraphs, and conclusion.` }); }
  else { trFb.push({ t: "good", m: `Organised into ${paras.length} paragraphs.` }); }

  if (hasOpinionMarker) { trFb.push({ t: "good", m: "A clear position/stance is signalled in the text." }); }
  else { tr -= 1; trFb.push({ t: "bad", m: "No clear position or thesis statement detected." }); }

  if (hasConclusionMarker) { trFb.push({ t: "good", m: "A concluding statement is present." }); }
  else { tr -= 0.5; trFb.push({ t: "bad", m: "No clear conclusion marker found." }); }

  if (prompt && prompt.trim().length > 5) {
    const promptWords = new Set(words(prompt).map(w => w.toLowerCase()).filter(w => !STOPWORDS.has(w) && w.length > 3));
    const bodyWords = new Set(content);
    let covered = 0; promptWords.forEach(w => { if (bodyWords.has(w)) covered++; });
    const coverage = promptWords.size ? covered / promptWords.size : 1;
    if (coverage < 0.25) { tr -= 1; trFb.push({ t: "bad", m: "Essay doesn't engage closely with the key terms of the question." }); }
    else { trFb.push({ t: "good", m: "Content engages with the key terms of the question." }); }
  } else { trFb.push({ t: "tip", m: "Add the essay question above next time for an accurate Task Response check." }); }

  const exampleHits = countOccurrences(text, ["for example", "for instance", "such as", "in particular", "to illustrate"]).n;
  if (exampleHits === 0) { tr -= 0.5; trFb.push({ t: "bad", m: "No explicit examples detected — support ideas with specific examples." }); }
  else { trFb.push({ t: "good", m: "Ideas are supported with examples/illustration." }); }
  tr = round5(clampBand(tr));

  let cc = 6.5; const ccFb = [];
  if (linkerInfo.n === 0) { cc -= 1.5; ccFb.push({ t: "bad", m: "No cohesive devices detected." }); }
  else if (linkerInfo.n < 4) { cc -= 0.5; ccFb.push({ t: "tip", m: "Some linking devices present, but variety is limited." }); }
  else { ccFb.push({ t: "good", m: `Good range of cohesive devices (${linkerInfo.n} instances, e.g. ${linkerInfo.found.slice(0, 4).join(", ")}).` }); }
  if (paras.length >= 4) { ccFb.push({ t: "good", m: "Clear paragraphing (intro/body/body/conclusion structure)." }); }
  else { cc -= 0.5; ccFb.push({ t: "bad", m: "Paragraphing could be clearer." }); }
  if (avgSentLen > 30) { cc -= 0.5; ccFb.push({ t: "bad", m: `Avg sentence length is ${avgSentLen.toFixed(1)} words — watch for run-ons.` }); }
  cc = round5(clampBand(cc));

  let lr = 6.5; const lrFb = [];
  if (ttr > 0.8) { lrFb.push({ t: "good", m: `Strong vocabulary range (${(ttr * 100).toFixed(0)}% unique).` }); }
  else if (ttr > 0.65) { lr -= 0.5; lrFb.push({ t: "tip", m: `Moderate vocabulary variety (${(ttr * 100).toFixed(0)}% unique).` }); }
  else { lr -= 1; lrFb.push({ t: "bad", m: `Limited vocabulary variety (${(ttr * 100).toFixed(0)}% unique).` }); }
  if (overused.length) { lrFb.push({ t: "bad", m: `Repeated frequently: ${overused.map(([w, c]) => `"${w}" (${c}×)`).join(", ")}.` }); lr -= 0.5; }
  const informalCount = (text.match(/\b(stuff|things|a lot of|kids|guys|gonna)\b/gi) || []).length;
  if (informalCount > 0) { lr -= 0.3; lrFb.push({ t: "bad", m: `${informalCount} informal/vague word(s) found — use precise, formal vocabulary.` }); }
  lr = round5(clampBand(lr));

  let gra = 6.5; const graFb = [];
  if (complexInfo.n === 0) { gra -= 1.5; graFb.push({ t: "bad", m: "No complex sentence structures detected." }); }
  else if (complexInfo.n < 5) { gra -= 0.5; graFb.push({ t: "tip", m: `Moderate use of complex structures (${complexInfo.n}) — increase variety.` }); }
  else { graFb.push({ t: "good", m: `Strong range of complex structures (${complexInfo.n} instances).` }); }
  if (passiveCount > 0) { graFb.push({ t: "good", m: `Passive voice used (${passiveCount}×) — shows grammatical range.` }); }
  if (sc < 8) { gra -= 0.5; graFb.push({ t: "bad", m: "Relatively few sentences for the word count." }); }
  gra = round5(clampBand(gra));

  const overall = round5((tr + cc + lr + gra) / 4);
  return { wc, sc, tr, cc, lr, gra, overall, trFb, ccFb, lrFb, graFb };
}

function FbList({ arr }) {
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

function Timer({ minutes }) {
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

export default function AcademicTask2Page() {
  const [text, setText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);

  const analyze = () => {
    if (words(text).length < 10) { alert("Please write at least 10 words before analyzing."); return; }
    setResult(analyzeTask2(text, prompt));
    setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f1e9", fontFamily: "'Helvetica Neue', Arial, sans-serif", color: "#1b2420" }}>
      <header style={{ borderBottom: "3px double #1b2420", padding: "28px 24px 18px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.22em", fontSize: 11, textTransform: "uppercase", color: "#3c5e4e", marginBottom: 8 }}>Academic · Task 2</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "clamp(26px,4vw,40px)", margin: "0 0 6px" }}>Essay Writing</h1>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#4a4538", margin: 0, fontSize: 14 }}>Paste your essay below for a band-by-band breakdown</p>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "30px 20px 70px" }}>
        <div style={{ background: "#fffdf7", border: "1px solid #cfc8b4", boxShadow: "0 6px 18px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 20px 10px 26px", borderBottom: "1px solid #cfc8b4" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 19, margin: 0 }}>Your Essay</h2>
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: "#7a7259" }}>40 MIN · 250 WORDS MIN</span>
          </div>
          <Timer minutes={40} />
          <div style={{ padding: "12px 20px 0 26px" }}>
            <label style={{ fontFamily: "'Courier New', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9a9277" }}>Essay question (optional)</label>
            <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. Some people think technology has made our lives more complex..." style={{ width: "100%", border: "none", borderBottom: "1px dashed #cfc8b4", background: "transparent", fontSize: 12.5, padding: "6px 2px", color: "#5a5440", outline: "none", boxSizing: "border-box" }} />
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="In recent years, the question of..." style={{ width: "100%", minHeight: 280, border: "none", resize: "vertical", padding: "16px 20px 16px 26px", fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.65, background: "transparent", color: "#1b2420", outline: "none", boxSizing: "border-box" }} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 20px 14px 26px", fontFamily: "'Courier New', monospace", fontSize: 11, color: "#8a8266" }}>
            <span>Words: <b>{words(text).length}</b></span><span>Sentences: <b>{sentences(text).length}</b></span>
          </div>
        </div>

        <div style={{ textAlign: "center", margin: "32px 0" }}>
          <button onClick={analyze} style={{ fontFamily: "'Courier New', monospace", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: 13, background: "#1b2420", color: "#f4f1e9", border: "none", padding: "15px 38px", cursor: "pointer" }}>Analyze My Writing</button>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "#7a7259", marginTop: 10 }}>Estimates are based on official IELTS band descriptors — informed approximation, not a certified score.</div>
        </div>

        {result && (
          <div id="results">
            <div style={{ textAlign: "center", padding: "36px 20px", marginBottom: 30, background: "#1b2420", color: "#f4f1e9" }}>
              <div style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.2em", fontSize: 11, color: "#b08a3e", textTransform: "uppercase" }}>Estimated Band Score</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(56px,9vw,80px)", fontWeight: 700, lineHeight: 1, margin: "6px 0" }}>{result.overall.toFixed(1)}</div>
            </div>
            <div style={{ background: "#fffdf7", border: "1px solid #cfc8b4" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 26px", borderBottom: "3px double #1b2420", background: "#eae5d8" }}>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: 0 }}>Essay Report</h3>
              </div>
              {[["Task Response", result.tr, result.trFb], ["Coherence & Cohesion", result.cc, result.ccFb], ["Lexical Resource", result.lr, result.lrFb], ["Grammatical Range & Accuracy", result.gra, result.graFb]].map(([title, score, fb], i) => (
                <div key={i} style={{ borderBottom: "1px solid #cfc8b4", padding: "18px 26px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ fontFamily: "Georgia, serif", fontSize: 16.5, margin: 0 }}>{title}</h4>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 15, fontWeight: "bold", background: "#3c5e4e", color: "#fff", padding: "3px 11px", borderRadius: 2 }}>{score.toFixed(1)} · {band5label(score)}</div>
                  </div>
                  <div style={{ marginTop: 12 }}><FbList arr={fb} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/writing-analyzer/academic" style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#8a8266", textDecoration: "none", textTransform: "uppercase" }}>← Back to Task Selection</Link>
        </div>
      </div>
    </div>
  );
}