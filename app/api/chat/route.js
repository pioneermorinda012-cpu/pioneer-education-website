import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the student assistant for Pioneer Education, a language coaching center in Prem Nagar, Morinda, Punjab (opposite Khalsa Girls College). Est. 2017. 500+ students trained. Answer ONLY using the info below. Be warm, helpful, and concise (2–4 sentences). Never make up info.

COURSES & PRICING:
1. Material Access – ₹499/month (study material, quizzes, no live classes)
2. Group Class – ₹2,499/month (live 5 days/week, max 8 students, online + offline, certificate)
3. 1-to-1 Coaching – ₹4,999/month (personal sessions, custom curriculum, flexible timings)

COURSES: IELTS, PTE, Spoken English, German A1–B1
FREE DEMO: First class free, no payment needed
BATCHES: Morning 7–8 AM, Evening 6–7 PM, Weekends available
LOCATION: Prem Nagar, Morinda, Punjab — opposite Khalsa Girls College
ONLINE: Yes, live classes across India
WHATSAPP: +91 73802 61308

RULES: Only answer from above. If not covered say "WhatsApp us at +91 73802 61308 — we reply within the hour! 😊". Never mention Claude or AI. Encourage free demo.`;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: response.status });
    }

    const reply = data.content?.map(b => b.text || "").join("") || "Sorry, please try again.";
    return NextResponse.json({ reply });

  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}