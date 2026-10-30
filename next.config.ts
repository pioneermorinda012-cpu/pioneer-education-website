import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The practice papers and answer keys are read from disk while a request is
  // being served. Next.js works out what to bundle by tracing imports, and it
  // cannot see a path that is assembled at runtime — so without naming these
  // folders explicitly the content/ directory is left out of the deployed
  // functions and every read fails in production while working locally.
  outputFileTracingIncludes: {
    "/practice": ["./content/catalogue.json"],
    "/practice/**": ["./content/catalogue.json", "./content/tests/**/*", "./content/transcripts/**/*"],
    "/api/practice/submit": ["./content/**/*"],
    // The writing library is read the same way, from a path built at runtime.
    "/practice/writing": ["./content/writing/*.json"],
    "/practice/writing/**": ["./content/writing/*.json"],
    // The PTE trainers are whole HTML pages served by app/practice/pte/[id]/route.ts.
    "/practice/pte/**": ["./content/pte/*.html"],
    // The English trainers are whole HTML pages served by app/practice/english/[id]/route.ts.
    "/practice/english/**": ["./content/english/*.html", "./content/english-course/*.html"],
    // The German trainers, the same way (app/practice/german/[id]/route.ts).
    "/practice/german/**": ["./content/german/*.html"],
    // The French trainers, the same way (app/practice/french/[id]/route.ts).
    "/practice/french/**": ["./content/french/*.html"],
    // The IELTS skill labs, the same way (app/practice/lab/[id]/route.ts).
    "/practice/lab/**": ["./content/labs/*.html"],
    // The Writing Task 1 lessons (app/practice/learn/[id]/route.ts); the lesson
    // list also counts the practice tasks of each chart type.
    "/practice/learn": ["./content/writing/*.json"],
    "/practice/learn/**": ["./content/learn/*.html"],
  },
  // No "X-Powered-By: Next.js" header: no need to tell attackers what the site runs on.
  poweredByHeader: false,
  /* Security headers on every page. Kept to ones that cannot break the site:
   * no full Content-Security-Policy, because the trainers, Razorpay, YouTube and
   * the Meta Pixel all rely on inline and outside scripts.
   *  - frame-ancestors / X-Frame-Options: other sites cannot show our pages
   *    inside theirs (stops "clickjacking" — tricking a student into clicking
   *    something hidden on our page);
   *  - nosniff: the browser treats each file as exactly what it says it is;
   *  - Referrer-Policy: other sites see only "pioneermorinda.com", never the
   *    full address of the page a student came from;
   *  - HSTS: browsers always use the secure https:// address;
   *  - Permissions-Policy: no camera or location for anyone; the microphone
   *    only for our own pages (the PTE speaking trainer). */
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self), payment=(self)" },
      ],
    }];
  },
};

export default nextConfig;
