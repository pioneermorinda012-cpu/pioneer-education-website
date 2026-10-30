"use client";

import { useEffect, useRef } from "react";

/* Cloudflare Turnstile — the free "I am human" check (lib/turnstile.ts does
 * the server half). Most visitors see nothing or a small tick; only a
 * suspicious one is asked to click. Shows nothing at all until
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is set in Vercel. */

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type TS = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};
declare global { interface Window { turnstile?: TS } }

let loading: Promise<void> | null = null;
function load(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!loading) {
    loading = new Promise((ok, no) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = () => ok();
      s.onerror = () => { loading = null; no(new Error("turnstile")); };
      document.head.appendChild(s);
    });
  }
  return loading;
}

export default function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let id = "";
    let gone = false;
    load().then(() => {
      if (gone || !box.current || !window.turnstile) return;
      id = window.turnstile.render(box.current, {
        sitekey: TURNSTILE_SITE_KEY,
        appearance: "interaction-only",
        size: "flexible",
        callback: (t: string) => cb.current(t),
        "expired-callback": () => cb.current(""),
        "error-callback": () => cb.current(""),
      });
    }).catch(() => cb.current(""));
    return () => { gone = true; if (id && window.turnstile) window.turnstile.remove(id); };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={box} style={{ margin: "10px 0", minHeight: 0 }} />;
}

/** Send a form to /api/lead; if the website cannot pass it on, send it to the
 *  Sheet directly the old way, so a real enquiry is never lost.
 *  Returns "" when saved, or an error to show the visitor. */
export async function sendLead(form: "enquiry" | "admission" | "chat", data: Record<string, unknown>,
  token: string, website: string, sheetUrl: string): Promise<string> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form, data, turnstile: token, website }),
    });
    if (res.ok) return "";
    const d = await res.json().catch(() => ({} as { error?: string; fallback?: boolean }));
    if (res.status < 500 && d.error) return d.error;      // a real refusal: tell the visitor
  } catch { /* the website could not be reached: fall through */ }
  try {
    await fetch(sheetUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  } catch (e) { console.log("Sheet save error:", e); }
  return "";
}
