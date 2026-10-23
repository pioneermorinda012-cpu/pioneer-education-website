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
    "/practice/english/**": ["./content/english/*.html"],
    // The German trainers, the same way (app/practice/german/[id]/route.ts).
    "/practice/german/**": ["./content/german/*.html"],
    // The Writing Task 1 lessons (app/practice/learn/[id]/route.ts); the lesson
    // list also counts the practice tasks of each chart type.
    "/practice/learn": ["./content/writing/*.json"],
    "/practice/learn/**": ["./content/learn/*.html"],
  },
};

export default nextConfig;
