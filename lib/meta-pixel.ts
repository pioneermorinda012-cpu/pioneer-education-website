/* Meta Pixel ID: 1101841526089756 (Pioneer Education's ad account).
 * This file is safe to import from anywhere, including server code —
 * trackEvent() does nothing until the browser-side pixel script has
 * loaded (see components/MetaPixel.tsx, rendered from app/layout.tsx).
 *
 * Why this matters: the pixel alone only tells Meta who visited the
 * site. Firing a "Lead" event when someone actually submits the
 * admission form is what lets Meta optimize ad delivery toward people
 * who convert, and builds the retargeting audience of people who
 * started the form without finishing it. */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const META_PIXEL_ID = "1101841526089756";

/** Fires a Meta Pixel standard or custom event. Does nothing if the pixel
 * hasn't loaded (ad blockers, or called before the script runs) — never throws. */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", name, params);
    }
  } catch (e) {
    console.error("meta pixel", e);
  }
}
