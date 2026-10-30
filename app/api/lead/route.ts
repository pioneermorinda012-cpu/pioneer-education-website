import { NextRequest, NextResponse } from "next/server";
import { hit, visitor } from "@/lib/ratelimit";
import { turnstileOk } from "@/lib/turnstile";

export const runtime = "nodejs";

/**
 * The enquiry, admission and chatbot forms send here; this checks the
 * visitor is a person and passes the lead on to the Google Sheet (the Apps
 * Script, which also emails the notification).
 *
 *  - a hidden "website" field that people never see: a bot that fills it in
 *    is told "thank you" and nothing is saved;
 *  - Cloudflare Turnstile, once its keys are set (lib/turnstile.ts);
 *  - at most 8 forms per device per hour;
 *  - every field cut to a sensible length, and a real Indian mobile number.
 *
 * If the Sheet cannot be reached from here the form is told to send it
 * itself (fallback: true), as it did before, so a real enquiry is never lost.
 */
const SHEETS: Record<string, string> = {
  enquiry: "https://script.google.com/macros/s/AKfycbwExqnIZvubS7LLWU6ZgNdK73GJDI3jY0fwhLyMlDtNorIfGwotRdRl17wEJX5U9dVYJQ/exec",
  chat: "https://script.google.com/macros/s/AKfycbwExqnIZvubS7LLWU6ZgNdK73GJDI3jY0fwhLyMlDtNorIfGwotRdRl17wEJX5U9dVYJQ/exec",
  admission: "https://script.google.com/macros/s/AKfycbyCsbI0ci_TJEitjK9wNNXlmDe4Eii-4jMHqq94T4CnGYrQSPVO7e9worcsSFl9SWn1OA/exec",
};

export async function POST(req: NextRequest) {
  let b: { form?: unknown; data?: unknown; turnstile?: unknown; website?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const form = typeof b.form === "string" && b.form in SHEETS ? b.form : "";
  if (!form || !b.data || typeof b.data !== "object" || Array.isArray(b.data)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  // the hidden field: people leave it empty
  if (typeof b.website === "string" && b.website.trim()) return NextResponse.json({ ok: true });

  const data: Record<string, string | boolean> = {};
  for (const [k, v] of Object.entries(b.data as Record<string, unknown>).slice(0, 30)) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(k)) continue;
    if (typeof v === "boolean") data[k] = v;
    else if (typeof v === "string") data[k] = v.slice(0, k === "address" ? 600 : 300);
  }
  const phone = String(data.phone ?? "");
  if (!String(data.name ?? "").trim() || !/^[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "Please enter your name and a valid 10-digit mobile number." }, { status: 400 });
  }

  const v = await hit("lead:" + visitor(req), 3600, 8);
  if (!v.allowed) {
    return NextResponse.json({ error: "Too many forms from this device. Please WhatsApp us at +91 73802 61308." }, { status: 429 });
  }
  if (!(await turnstileOk(typeof b.turnstile === "string" ? b.turnstile : "", req))) {
    return NextResponse.json({ error: "Please complete the quick check (\"I am human\") and try again." }, { status: 400 });
  }

  try {
    const res = await fetch(SHEETS[form], {
      method: "POST",
      // the same as the browser sent before: JSON as plain text
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`sheet ${res.status}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("lead forward", form, e);
    return NextResponse.json({ ok: false, fallback: true }, { status: 502 });
  }
}
