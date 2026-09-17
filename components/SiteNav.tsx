"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* One navigation for the whole site.
 *
 * There used to be three copies — the home page, the about page and the course
 * pages each had their own — which is how the about and course pages ended up
 * with four links while the home page had ten, and why a change to one of them
 * silently left the others behind. */

const LINKS: [string, string][] = [
  ["#courses", "Courses"],
  ["#results", "Results"],
  ["#pricing", "Pricing"],
  ["#app", "Lexio App"],
  ["/about", "About"],
  ["/practice", "Practice Tests"],
  ["/writing-analyzer", "Writing Analyzer"],
  ["#reviews", "Reviews"],
  ["#contact", "Contact"],
];

export default function SiteNav({ ctaHref = "#demo" }: { ctaHref?: string }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // A bare "#courses" only works on the home page; elsewhere it must go home first.
  const to = (h: string) => (h.startsWith("#") && !onHome ? `/${h}` : h);

  useEffect(() => {
    // The panel hangs below the bar, so it needs the bar's real height.
    const measure = () => {
      const h = navRef.current?.offsetHeight;
      if (h) document.documentElement.style.setProperty("--nav-h", `${h}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  const external = ctaHref.startsWith("http");

  return (
    <nav ref={navRef}>
      <div className="nav-inner">
        <Link href="/" className="logo">
          <div className="logo-mark">P</div>
          <span className="word">Pioneer Education</span>
        </Link>

        <div className="nav-links" id="site-menu" data-open={open ? "true" : "false"}>
          {LINKS.map(([href, label]) => (
            <Link key={href} href={to(href)} onClick={() => setOpen(false)}>{label}</Link>
          ))}
          <a
            href={ctaHref} className="btn btn-coral m-cta" onClick={() => setOpen(false)}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            Book Free Demo
          </a>
        </div>

        <div className="nav-cta">
          <a
            href={ctaHref} className="btn btn-coral"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            Book Free Demo
          </a>
        </div>

        <button
          type="button" className="nav-burger" aria-label="Menu"
          aria-expanded={open} aria-controls="site-menu"
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
