import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The practice papers and answer keys are read from disk while a request is
  // being served. Next.js works out what to bundle by tracing imports, and it
  // cannot see a path that is assembled at runtime — so without naming these
  // folders explicitly the content/ directory is left out of the deployed
  // functions and every read fails in production while working locally.
  outputFileTracingIncludes: {
    "/practice": ["./content/catalogue.json"],
    "/practice/**": ["./content/catalogue.json", "./content/tests/**/*"],
    "/api/practice/submit": ["./content/**/*"],
  },
};

export default nextConfig;
