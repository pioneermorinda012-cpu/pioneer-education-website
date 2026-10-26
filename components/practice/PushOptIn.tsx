"use client";

import { useEffect, useState } from "react";

/* "Turn on practice reminders" — shown under the top bar of the practice
 * pages to a signed-in student until they turn reminders on or say not now.
 *
 * Android, Windows, Mac (Chrome, Edge, Firefox, Safari): one tap, then the
 * browser asks permission. iPhone/iPad: Apple allows web notifications only
 * when the site has been added to the home screen and opened from there, so
 * in Safari we show how to do that instead of a button that cannot work.
 *
 * Once on, the subscription is sent again on every visit, so it stays linked
 * to whoever is signed in on this phone. */

type State = "hidden" | "ask" | "ios" | "busy" | "on" | "blocked" | "error";
const SNOOZE = "pioneer-push-snooze";

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function send(sub: PushSubscription, off = false) {
  const res = await fetch("/api/practice/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), off }),
  });
  if (!res.ok) throw new Error(String(res.status));
}

export default function PushOptIn({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<State>("hidden");
  const [justOn, setJustOn] = useState(false);

  useEffect(() => {
    let snoozed = false;
    try { snoozed = Number(localStorage.getItem(SNOOZE) || 0) > Date.now(); } catch { /* private mode */ }
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

    if (!supported) {
      if (ios && !standalone && !snoozed) setState("ios");
      return;
    }
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        if (sub && Notification.permission === "granted") {
          send(sub).catch(() => {});        // keep it linked to this student
          return;                           // already on: nothing to show
        }
        if (Notification.permission === "denied") return;
        if (!snoozed) setState("ask");
      } catch { /* no service worker (e.g. an in-app browser): say nothing */ }
    })();
  }, []);

  async function turnOn() {
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState(perm === "denied" ? "blocked" : "ask"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) }));
      await send(sub);
      setJustOn(true);
      setState("on");
    } catch {
      setState("error");
    }
  }

  function later() {
    try { localStorage.setItem(SNOOZE, String(Date.now() + 7 * 86_400_000)); } catch { /* fine */ }
    setState("hidden");
  }

  if (state === "hidden" || (state === "on" && !justOn)) return null;

  return (
    <div className="wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
      <div className="ln-first pu-box" role="region" aria-label="Practice reminders">
        {state === "on" ? (
          <div><b>Reminders are on.</b> You&apos;ll get a word of the day each morning, and a reminder in the evening if you haven&apos;t practised.</div>
        ) : state === "ios" ? (
          <div>
            <b>Get practice reminders on your iPhone:</b> tap the Share button <span aria-hidden>⎙</span> below, choose
            <b> Add to Home Screen</b>, then open Pioneer from your home screen and turn reminders on there.
          </div>
        ) : state === "blocked" ? (
          <div><b>Notifications are blocked</b> for this site. To get reminders, allow notifications for pioneermorinda.com in your browser settings.</div>
        ) : state === "error" ? (
          <div><b>That didn&apos;t work on this browser.</b> Try opening the site in Chrome (Android) or from your home screen (iPhone).</div>
        ) : (
          <div><b>Practice reminders:</b> a word of the day each morning, and a nudge in the evening if you haven&apos;t practised yet.</div>
        )}
        <div className="pu-go">
          {(state === "ask" || state === "busy" || state === "error") && (
            <button className="btn btn-coral" type="button" onClick={turnOn} disabled={state === "busy"}>
              {state === "busy" ? "Turning on…" : "🔔 Turn on reminders"}
            </button>
          )}
          {state !== "on" && (
            <button className="btn btn-outline" type="button" onClick={later}>Not now</button>
          )}
        </div>
      </div>
    </div>
  );
}
