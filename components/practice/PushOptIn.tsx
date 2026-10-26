"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/* Practice reminders, for a signed-in student. Three parts:
 *
 * 1. The 🔔 button in the top bar, always there. It opens a panel that says
 *    whether reminders are on in this browser, with the one thing to do next:
 *    turn on / turn off; inside WhatsApp or Instagram "Open in Chrome" (their
 *    built-in browsers cannot receive notifications); blocked → how to allow;
 *    iPhone Safari → Add to Home Screen first (Apple's rule). Below that, the
 *    messages this phone has received, newest first.
 * 2. Once, under the top bar: a card offering reminders ("Not now" hides it
 *    for a week; the 🔔 button stays).
 * 3. After a notification is tapped: the full message at the top of the page.
 *    public/sw.js keeps every message on the phone (IndexedDB "pioneer" →
 *    "inbox") and opens the page with ?pmsg=<id>.
 *
 * The card and the banner are drawn into <div id="pu-slot"> under the bar
 * (app/practice/layout.tsx); the button sits in the bar itself.
 */

type Status = "loading" | "on" | "off" | "blocked" | "inapp" | "ios-install" | "unsupported";
type Msg = { id: string; title: string; body: string; url: string; at: number };

const SNOOZE = "pioneer-push-snooze";
const SEEN = "pioneer-inbox-seen";

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function tell(sub: PushSubscription, off = false) {
  const res = await fetch("/api/practice/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), off }),
  });
  if (!res.ok) throw new Error(String(res.status));
}

/* the same store public/sw.js writes */
function readInbox(): Promise<Msg[]> {
  return new Promise((ok) => {
    try {
      const r = indexedDB.open("pioneer", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("inbox", { keyPath: "id" });
      r.onerror = () => ok([]);
      r.onsuccess = () => {
        try {
          const all = r.result.transaction("inbox", "readonly").objectStore("inbox").getAll();
          all.onsuccess = () => ok((all.result as Msg[]).sort((a, b) => b.at - a.at));
          all.onerror = () => ok([]);
        } catch { ok([]); }
      };
    } catch { ok([]); }
  });
}

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

const when = (t: number) => {
  const d = new Date(t);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + ", " +
      d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
};

export default function PushOptIn({ publicKey }: { publicKey: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [seen, setSeen] = useState(0);
  const [banner, setBanner] = useState<Msg | null>(null);
  const [card, setCard] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [ios, setIos] = useState(false);

  const loadInbox = useCallback(async () => {
    const list = await readInbox();
    setMsgs(list);
    return list;
  }, []);

  useEffect(() => {
    setSlot(document.getElementById("pu-slot"));
    setSeen(Number(ls.get(SEEN) || 0));
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIos(isIos);
    const inApp = /; wv\)|FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Snapchat/i.test(ua);
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    const snoozed = Number(ls.get(SNOOZE) || 0) > Date.now();

    // a tapped notification: show its message at the top, then tidy the address
    const pmsg = new URLSearchParams(location.search).get("pmsg");
    loadInbox().then((list) => {
      if (!pmsg) return;
      setBanner(list.find((m) => m.id === pmsg) ?? null);
      const u = new URL(location.href);
      u.searchParams.delete("pmsg");
      history.replaceState(history.state, "", u.pathname + u.search + u.hash);
    });

    const settle = (s: Status) => {
      setStatus(s);
      if (!snoozed && (s === "off" || s === "inapp" || s === "ios-install")) setCard(true);
    };
    if (inApp) { settle("inapp"); return; }
    if (!supported) { settle(isIos && !standalone ? "ios-install" : "unsupported"); return; }
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        if (Notification.permission === "denied") { settle("blocked"); return; }
        if (sub && Notification.permission === "granted") {
          setStatus("on");
          tell(sub).catch(() => {});        // keep it linked to whoever is signed in here
          return;
        }
        settle("off");
      } catch { settle("unsupported"); }
    })();
  }, [loadInbox]);

  async function turnOn() {
    setBusy(true); setProblem("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setStatus(perm === "denied" ? "blocked" : "off"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) }));
      await tell(sub);
      setStatus("on"); setCard(false);
    } catch {
      setProblem("That didn't work in this browser. On Android, open the site in Chrome; on iPhone, from your home screen.");
    } finally { setBusy(false); }
  }

  async function turnOff() {
    setBusy(true); setProblem("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await tell(sub, true).catch(() => {}); await sub.unsubscribe(); }
      setStatus("off");
    } catch {
      setProblem("Could not turn reminders off. Try again, or block notifications for this site in your browser settings.");
    } finally { setBusy(false); }
  }

  function later() { ls.set(SNOOZE, String(Date.now() + 7 * 86_400_000)); setCard(false); }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) { loadInbox(); const now = Date.now(); ls.set(SEEN, String(now)); setTimeout(() => setSeen(now), 1500); }
  }

  const unread = msgs.filter((m) => m.at > seen).length;
  const chrome = typeof location !== "undefined"
    ? `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;end`
    : "#";

  /* what this browser can do, in one line, with its one action */
  const statusBlock = (
    <div className="pu-status">
      {status === "loading" && <p>Checking…</p>}
      {status === "on" && (<>
        <p><b>Reminders are on</b> on this phone: a word of the day each morning, and an evening reminder if you haven&apos;t practised.</p>
        <button className="btn btn-outline" type="button" onClick={turnOff} disabled={busy}>Turn off</button>
      </>)}
      {status === "off" && (<>
        <p><b>Reminders are off.</b> Turn them on for a word of the day each morning and an evening reminder if you haven&apos;t practised.</p>
        <button className="btn btn-coral" type="button" onClick={turnOn} disabled={busy}>{busy ? "Turning on…" : "🔔 Turn on reminders"}</button>
      </>)}
      {status === "blocked" && (
        <p><b>Notifications are blocked</b> for this site. In Chrome: tap the icon to the left of the web address → <b>Permissions</b> → <b>Notifications</b> → <b>Allow</b>, then reload this page.</p>
      )}
      {status === "inapp" && (ios ? (
        <p><b>This is WhatsApp or Instagram&apos;s built-in browser</b>, which can&apos;t show reminders. Tap <b>⋯</b> and choose <b>Open in Safari</b>, then add Pioneer to your home screen.</p>
      ) : (<>
        <p><b>This is WhatsApp or Instagram&apos;s built-in browser</b>, which can&apos;t show reminders. Open the site in Chrome to turn them on.</p>
        <a className="btn btn-coral" href={chrome}>Open in Chrome</a>
      </>))}
      {status === "ios-install" && (
        <p><b>On iPhone:</b> tap the Share button <span aria-hidden>⎙</span>, choose <b>Add to Home Screen</b>, then open Pioneer from your home screen and tap 🔔 there.</p>
      )}
      {status === "unsupported" && (
        <p><b>This browser can&apos;t show reminders.</b> Use Chrome on Android, or Safari from your home screen on iPhone.</p>
      )}
      {problem && <p className="pu-problem">{problem}</p>}
    </div>
  );

  return (
    <>
      <button type="button" className="pu-bell" onClick={toggle} aria-expanded={open} aria-label={`Reminders and messages${unread ? `, ${unread} new` : ""}`}>
        <span aria-hidden>🔔</span>
        {unread > 0 && <span className="pu-dot">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {/* drawn on <body>, so the top bar's layer cannot hide it under the page */}
      {open && createPortal(
        <>
          <div className="pu-scrim" onClick={() => setOpen(false)} />
          <div className="pu-panel" role="dialog" aria-label="Reminders and messages">
            <div className="pu-head"><b>Reminders</b><button type="button" onClick={() => setOpen(false)} aria-label="Close">✕</button></div>
            {statusBlock}
            <div className="pu-head pu-sub"><b>Messages</b></div>
            {msgs.length === 0 ? (
              <p className="pu-empty">No messages on this phone yet.</p>
            ) : (
              <ul className="pu-list">
                {msgs.map((m) => (
                  <li key={m.id} className={m.at > seen ? "new" : undefined}>
                    <a href={m.url} onClick={() => setOpen(false)}>
                      <span className="t">{m.title}</span>
                      <span className="b">{m.body}</span>
                      <span className="w">{when(m.at)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>,
        document.body,
      )}

      {slot && (banner || card) && createPortal(
        <div className="wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          {banner && (
            <div className="ln-first pu-box pu-msg" role="status">
              <div><b>📩 {banner.title}</b><br />{banner.body}</div>
              <div className="pu-go"><button className="btn btn-outline" type="button" onClick={() => setBanner(null)}>OK</button></div>
            </div>
          )}
          {card && !banner && (
            <div className="ln-first pu-box" role="region" aria-label="Practice reminders">
              {statusBlock}
              <div className="pu-go"><button className="btn btn-outline" type="button" onClick={later}>Not now</button></div>
            </div>
          )}
        </div>,
        slot,
      )}
    </>
  );
}
