import type { MetadataRoute } from "next";
import { COURSES } from "./data/courses";

const BASE_URL = "https://www.pioneermorinda.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    // Free video lessons. Weekly, because the page reads the YouTube
    // feed and changes whenever a new video is posted — telling Google
    // "monthly" would have it crawling long after the page had moved on.
    { url: `${BASE_URL}/videos`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    // The free IELTS Speaking Part 1 question bank — a static file in
    // public/, not a route, which is why it carries its own .html.
    //
    // ⚠️  IT IS FREE AND PUBLIC DELIBERATELY, AND THE REST IS NOT.
    // This file holds the questions only: no model answers. The cue
    // cards, the vocabulary lessons and the 100 personalised topics
    // stay inside the app, because those are the teaching. Publishing
    // this one costs nothing — the Part 1 topics are public knowledge
    // — and it is the page most likely to bring a stranger in from a
    // search for "IELTS speaking part 1 questions".
    { url: `${BASE_URL}/ielts-speaking-part-1-questions.html`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    // The free English Level Test & Grammar Quiz — public on purpose: it is
    // the page most likely to bring a stranger in, and its result screen
    // offers the Spoken English / IELTS course and a free demo.
    { url: `${BASE_URL}/english-grammar-quiz`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/writing-analyzer`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/writing-analyzer/academic`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/writing-analyzer/academic/task1`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/writing-analyzer/academic/task2`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/writing-analyzer/gt`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/writing-analyzer/gt/task1`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/writing-analyzer/gt/task2`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    // Required by Google Play for the Pioneer Education app. Low priority — these
    // exist for compliance and for users who need them, not for search.
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/delete-account`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const courseRoutes: MetadataRoute.Sitemap = COURSES.map((c) => ({
    url: `${BASE_URL}/courses/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...courseRoutes];
}
