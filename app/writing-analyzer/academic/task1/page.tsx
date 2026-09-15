"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STOPWORDS = new Set("the a an and or but if of to in on at for with as by from is are was were be been being this that these those it its i you he she we they my your his her our their not no so very can could will would should may might do does did have has had".split(" "));

function words(text: string): string[] { return text.trim().match(/[A-Za-z']+/g) || []; }
function sentences(text: string): string[] { return text.trim().match(/[^.!?]+[.!?]+/g) || (text.trim() ? [text.trim()] : []); }

const CHART_LINKERS = ["overall","in general","as can be seen","it is clear that","the most notable","significantly","dramatically","steadily","gradually","sharply","slightly","in contrast","by contrast","while","whereas","compared to","compared with","similarly","likewise","on the other hand","moreover","furthermore","in addition","followed by","subsequently","during this period","over the period","between","from","to","rose","fell","increased","decreased","peaked","reached a peak","dropped","remained stable","remained constant","fluctuated","levelled off"];
const DATA_WORDS = ["percent","%","million","billion","thousand","doubled","tripled","times","figure","proportion","majority","minority","number","amount","rate","ratio","total"];
const OVERVIEW_MARKERS = ["overall","in general","in summary","it is clear","the most notable","the main","to summarise","to summarize"];
const PASSIVE_RE = /\b(is|are|was|were|been|being|be)\s+\w+ed\b/gi;
const COMPLEX_MARKERS = ["which","while","whereas","although","despite","in spite of","even though","as","since","because","when","after","before","by"];

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

function analyzeTask1(text: string) {
  const ws = words(text);
  const wc = ws.length;
  const sents = sentences(text);
  const sc = sents.length || 1;
  const { ttr } = uniqueWordRatio(ws);
  const linkerInfo = countOccurrences(text, CHART_LINKERS);
  const dataInfo = countOccurrences(text, DATA_WORDS);
  const overviewInfo = countOccurrences(text, OVERVIEW_MARKERS);
  const complexInfo = countOccurrences(text, COMPLEX_MARKERS);
  const passiveCount = (text.match(PASSIVE_RE) || []).length;
  const lowerText = text.toLowerCase();
  const hasNumbers = /\d+/.test(text);

  let tr = 6.5; const trFb: {t: string; m: string}[] = [];
  if (wc < 120) { tr -= 2; trFb.push({ t: "bad", m: `Only ${wc} words — well under the 150-word minimum. Significant penalty.` }); }
  else if (wc < 150) { tr -= 1; trFb.push({ t: "bad", m: `${wc} words — slightly under the 150-word minimum. Aim for 160–200.` }); }
  else if (wc > 250) { trFb.push({ t: "tip", m: `${wc} words — quite long for Task 1. Focus on key trends, not every detail.` }); }
  else { trFb.push({ t: "good", m: `Word count (${wc}) is appropriate for Task 1.` }); }

  if (overviewInfo.n > 0) { trFb.push({ t: "good", m: `Overview statement detected (e.g. "${overviewInfo.found[0]}") — essential for Band 6+.` }); }
  else { tr -= 1.5; trFb.push({ t: "bad", m: "No overview statement found. An overview is the most important element of Task 1." }); }

  if (hasNumbers) { trFb.push({ t: "good", m: "Specific data/figures referenced — good for Task Achievement." }); }
  else { tr -= 0.5; trFb.push({ t: "bad", m: "No specific figures or data detected. Always support trends with numbers." }); }

  if (dataInfo.n >= 3) { trFb.push({ t: "good", m: `Good use of data language (${dataInfo.found.slice(0, 4).join(", ")}).` }); }
  else { tr -= 0.5; trFb.push({ t: "tip", m: "Use more specific data vocabulary (e.g. percent, million, doubled, proportion)." }); }

  const hasIntro = /(the (graph|chart|diagram|table|figure|pie|bar|line)|shows|illustrates|compares|presents)/i.test(lowerText);
  if (hasIntro) { trFb.push({ t: "good", m: "Introduction paraphrases the chart/graph description." }); }
  else { tr -= 0.5; trFb.push({ t: "bad", m: "No clear introduction sentence describing the chart type/topic." }); }
  tr = round5(clampBand(tr));

  let cc = 6.5; const ccFb: {t: string; m: string}[] = [];
  if (linkerInfo.n >= 5) { ccFb.push({ t: "good", m: `Strong use of linking/comparison language (${linkerInfo.n} instances, e.g. ${linkerInfo.found.slice(0, 3).join(", ")}).` }); }
  else if (linkerInfo.n >= 2) { cc -= 0.5; ccFb.push({ t: "tip", m: `Some linking language present (${linkerInfo.n}). Add more comparison phrases.` }); }
  else { cc -= 1.5; ccFb.push({ t: "bad", m: "Very limited linking language — needed to show trends and make comparisons." }); }
  if (sc >= 4) { ccFb.push({ t: "good", m: `${sc} sentences — good for organising information clearly.` }); }
  else { cc -= 0.5; ccFb.push({ t: "tip", m: "More sentences needed to properly structure your description." }); }
  cc = round5(clampBand(cc));

  let lr = 6.5; const lrFb: {t: string; m: string}[] = [];
  if (ttr > 0.75) { lrFb.push({ t: "good", m: `Good vocabulary range (${(ttr * 100).toFixed(0)}% unique words).` }); }
  else if (ttr > 0.6) { lr -= 0.5; lrFb.push({ t: "tip", m: `Moderate vocabulary range (${(ttr * 100).toFixed(0)}% unique). Try more synonyms for common words.` }); }
  else { lr -= 1; lrFb.push({ t: "bad", m: `Limited vocabulary range (${(ttr * 100).toFixed(0)}% unique). Avoid repeating the same words.` }); }
  const trendWords = countOccurrences(text, ["rose","increased","grew","climbed","fell","decreased","declined","dropped","remained","stable","fluctuated","peaked","levelled"]);
  if (trendWords.n >= 3) { lrFb.push({ t: "good", m: `Good range of trend vocabulary (${trendWords.found.slice(0,4).join(", ")}).` }); }
  else { lr -= 0.5; lrFb.push({ t: "tip", m: "Use varied trend vocabulary: rose, declined, peaked, fluctuated, levelled off." }); }
  lr = round5(clampBand(lr));

  let gra = 6.5; const graFb: {t: string; m: string}[] = [];
  if (complexInfo.n >= 4) { graFb.push({ t: "good", m: `Good use of complex structures (${complexInfo.n} instances).` }); }
  else { gra -= 0.5; graFb.push({ t: "tip", m: "Include more complex sentences using while, whereas, although, which." }); }
  if (passiveCount >= 2) { graFb.push({ t: "good", m: `Passive voice used (${passiveCount}×) — appropriate for academic writing.` }); }
  else { gra -= 0.5; graFb.push({ t: "tip", m: "Use passive voice where appropriate: 'A sharp increase was recorded...'" }); }
  gra = round5(clampBand(gra));

  const overall = round5((tr + cc + lr + gra) / 4);
  return { wc, sc, tr, cc, lr, gra, overall, trFb, ccFb, lrFb, graFb };
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

export default function AcademicTask1Page() {
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
        <div style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.22em", fontSize: 11, textTransform: "uppercase", color: "#3c5e4e", marginBottom: 8 }}>Academic · Task 1</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "clamp(26px,4vw,40px)", margin: "0 0 6px" }}>Graph & Chart Description</h1>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#4a4538", margin: 0, fontSize: 14 }}>Paste your description below for a band-by-band breakdown</p>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "30px 20px 70px" }}>
        <div style={{ background: "#fffdf7", border: "1px solid #cfc8b4", boxShadow: "0 6px 18px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 20px 10px 26px", borderBottom: "1px solid #cfc8b4" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 19, margin: 0 }}>Your Description</h2>
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: "#7a7259" }}>20 MIN · 150 WORDS MIN</span>
          </div>
          <Timer minutes={20} />
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="The graph shows the changes in... Overall, it is clear that..." style={{ width: "100%", minHeight: 260, border: "none", resize: "vertical", padding: "16px 20px 16px 26px", fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.65, background: "transparent", color: "#1b2420", outline: "none", boxSizing: "border-box" }} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 20px 14px 26px", fontFamily: "'Courier New', monospace", fontSize: 11, color: "#8a8266" }}>
            <span>Words: <b>{words(text).length}</b></span>
            <span>Sentences: <b>{sentences(text).length}</b></span>
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
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#cfc8b4" }}>{result.wc} words · {result.sc} sentences</div>
            </div>
            <div style={{ background: "#fffdf7", border: "1px solid #cfc8b4" }}>
              <div style={{ padding: "18px 26px", borderBottom: "3px double #1b2420", background: "#eae5d8" }}>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: 0 }}>Description Report</h3>
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
          <Link href="/writing-analyzer/academic" style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#8a8266", textDecoration: "none", textTransform: "uppercase" }}>← Back to Task Selection</Link>
        </div>
      </div>
    </div>
  );
}
