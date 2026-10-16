"use client";

import { useEffect, useState, type ReactNode } from "react";

/* The fees stay folded away until the student asks for them — by tapping
 * "See Pricing" at the top of the page (a link to #fees) or the button here.
 * The plans are still in the page for search engines; they are only hidden
 * from view. */
export default function PricingReveal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = () => { if (window.location.hash === "#fees") setOpen(true); };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  /* Tapping the same "#fees" link twice does not fire hashchange, so the top
     button is also caught directly. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href="#fees"]');
      if (a) setOpen(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (open) return <>{children}</>;
  return (
    <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
      <button type="button" className="btn btn-coral" onClick={() => setOpen(true)}>
        See Pricing
      </button>
      <p style={{ color: "var(--grey)", fontSize: "0.9rem", marginTop: 12 }}>
        Three plans: Online Self-Study, Group Class and 1-to-1 Coaching.
      </p>
    </div>
  );
}
