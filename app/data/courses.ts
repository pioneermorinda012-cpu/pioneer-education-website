/** How long one payment covers. */
export type Term = "1m" | "3m";
export const TERM_LABEL: Record<Term, string> = { "1m": "1 month", "3m": "3 months" };

export type Plan = {
  name: string;
  tier: "self" | "group" | "one";
  term: Term;
  /** German is priced per level (A1, A2, B1); other courses leave this out. */
  level?: string;
  /**
   * The fee in rupees for the whole term. A number shows the price; null
   * shows "Fee on request" — or "Coming soon" when comingSoon is set.
   */
  price: number | null;
  comingSoon?: boolean;
  period: string;
  feats: string[];
  featured?: boolean;
  /**
   * The Razorpay payment page/link for exactly this plan, level and term.
   * Leave it out and the card offers WhatsApp instead of "Pay now".
   */
  payLink?: string;
};

/** "German A1 · Group Class · 3 months" — for emails and the student's batch. */
export function planTitle(p: Plan): string {
  return [p.level, p.name, TERM_LABEL[p.term]].filter(Boolean).join(" · ");
}

export type Course = {
  slug: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  modules: { title: string; desc: string }[];
  forWhom: string[];
  duration: string;
  plans: Plan[];
  faqs: { q: string; a: string }[];
  /** A free demo lesson (YouTube or any link). Shown under the course title. */
  demoVideo?: string;
  /** A short video explaining the course (YouTube or any link). */
  explainVideo?: string;
};

/**
 * The three plans every course is sold under, for one term (and one level,
 * for German). Each fee is a number, null for "Fee on request", or "soon"
 * for "Coming soon".
 */
type Fee = number | null | "soon";

const FEATS = {
  self: [
    "Full access to the study material and practice tests",
    "Recorded lectures, watchable while enrolled",
    "Flexible timings — study when you can",
    "Practice quizzes",
  ],
  group: [
    "Live classes 5 days a week",
    "Maximum 10 students per batch",
    "Online and offline both",
    "Weekly progress feedback",
    "Study material and practice tests included",
  ],
  one: [
    "Dedicated personal sessions",
    "Curriculum built around you",
    "Flexible timings",
    "Interview preparation",
    "Priority WhatsApp support",
  ],
};

function tierPlans(term: Term, fees: [Fee, Fee, Fee], level?: string): Plan[] {
  const tiers = [
    { tier: "self", name: "Self-Study & Material Access" },
    { tier: "group", name: "Group Class", featured: true },
    { tier: "one", name: "1-to-1 Intensive Class" },
  ] as const;
  return tiers.map((t, i) => {
    const fee = fees[i];
    return {
      name: t.name,
      tier: t.tier,
      term,
      ...(level ? { level } : {}),
      price: typeof fee === "number" ? fee : null,
      ...(fee === "soon" ? { comingSoon: true } : {}),
      period: term === "1m" ? "/month" : "for 3 months",
      feats: FEATS[t.tier],
      ...("featured" in t ? { featured: true } : {}),
    };
  });
}

/** One month and three months of the three plans: [self-study, group, 1-to-1] each. */
const plans = (oneMonth: [Fee, Fee, Fee], threeMonths: [Fee, Fee, Fee], level?: string): Plan[] => [
  ...tierPlans("1m", oneMonth, level),
  ...tierPlans("3m", threeMonths, level),
];

export const COURSES: Course[] = [
  {
    slug: "ielts",
    name: "IELTS Coaching",
    icon: "✈️",
    tagline: "Academic & General Training — full preparation for all four modules.",
    description:
      "Our IELTS course covers Listening, Reading, Writing, and Speaking with real mock tests, banded feedback, and a curriculum built around nine years of watching exactly where Punjabi students lose marks. Both Academic and General Training tracks are covered, with content tailored to whether you're headed for university admission or migration.",
    modules: [
      { title: "Listening", desc: "Note completion, multiple choice, map labelling, and matching — all four question types with real recorded practice tests." },
      { title: "Reading", desc: "Skimming, scanning, True/False/Not Given, matching headings, and summary completion, drilled with timed passages." },
      { title: "Writing", desc: "Task 1 (graphs, letters) and Task 2 (essays) with structure templates and Band 7+ vocabulary in context." },
      { title: "Speaking", desc: "All 3 parts practiced live with instructors, including cue card strategy and fluency coaching." },
    ],
    forWhom: [
      "Students applying to universities abroad (Academic)",
      "Those pursuing PR or work visas (General Training)",
      "Anyone needing a specific band score for immigration",
    ],
    duration: "4–5 hours daily, weekday batches with evening options",
    plans: plans([1499, 3499, 6999], [3499, 8999, 17999]),
    // demoVideo: "https://youtu.be/…",      explainVideo: "https://youtu.be/…",
    faqs: [
      { q: "How long does the course take?", a: "Most students prepare in 6–10 weeks depending on their starting level and target band." },
      { q: "Do you cover both Academic and General Training?", a: "Yes — the core skills overlap, and we tailor Reading and Writing Task 1 practice to whichever version you're taking." },
      { q: "How often are mock tests?", a: "Every Friday, with detailed written feedback so you can track real progress week to week." },
    ],
  },
  {
    slug: "pte",
    name: "PTE Coaching",
    icon: "💻",
    tagline: "Computer-delivered test strategy, templates, and timed practice.",
    description:
      "PTE Academic is scored by AI, which means strategy and templates matter as much as raw English ability. Our course covers every task type across Speaking, Writing, Reading, and Listening, with a strong focus on the scoring algorithm's patterns — what it rewards, what it penalizes, and how to structure answers accordingly.",
    modules: [
      { title: "Speaking & Writing", desc: "Read Aloud, Repeat Sentence, Describe Image, Retell Lecture, and essay writing with proven templates." },
      { title: "Reading", desc: "Fill in the blanks, reorder paragraphs, and multiple choice, practiced against the clock." },
      { title: "Listening", desc: "Summarize spoken text, fill in the blanks, and highlight correct summary — pattern recognition for AI scoring." },
      { title: "Exam Strategy", desc: "Time management across the full test and how to navigate the exact exam interface." },
    ],
    forWhom: [
      "Students who want a faster result than IELTS typically allows",
      "Applicants to Australia, New Zealand, and Canada (widely accepted)",
      "Those more comfortable with computer-based testing",
    ],
    duration: "Flexible batches — typically 3–6 weeks",
    plans: plans([999, null, null], [2499, null, null]),
    faqs: [
      { q: "Is PTE easier than IELTS?", a: "Not easier exactly, but more predictable — since it's AI-scored, strong templates and strategy consistently produce reliable results." },
      { q: "How fast are PTE results?", a: "Usually within 1–2 business days, much faster than IELTS." },
      { q: "Do you provide practice on the real test software?", a: "Yes, our timed practice matches the actual PTE Academic interface." },
    ],
  },
  {
    slug: "spoken-english",
    name: "Spoken English",
    icon: "🗣️",
    tagline: "Confidence-first speaking practice for daily life, interviews, and work.",
    description:
      "This course is built for students who understand English but freeze when they need to speak it. We focus on breaking the habit of translating from Punjabi/Hindi in your head, building real conversational fluency through daily speaking practice, grammar in context, and vocabulary you'll actually use — not just textbook lists.",
    modules: [
      { title: "Grammar in Context", desc: "Simple Present through Conditionals, taught through speaking practice rather than isolated drills." },
      { title: "Vocabulary & Idioms", desc: "250+ everyday words and common idioms, drilled with visual presentations and games." },
      { title: "Pronunciation", desc: "Word and sentence stress, plus common sounds that trip up Punjabi speakers specifically." },
      { title: "Real Conversation", desc: "Interviews, phone calls, workplace English, and everyday situations — practiced live, not scripted." },
    ],
    forWhom: [
      "Complete beginners building English from scratch",
      "Intermediate speakers who want to sound more natural",
      "Anyone preparing for job interviews or workplace communication",
    ],
    duration: "Beginner to Advanced, self-paced batches",
    // The ₹999 Razorpay page (pages.razorpay.com/pl_NHIt9P9D83nsDm) was the old
    // price, so it is not shown until a link for the new fee is added.
    plans: plans([799, 1999, 4999], [1499, 4999, 12499]),
    faqs: [
      { q: "I understand English but can't speak it — is this for me?", a: "Yes, this is exactly who the course is designed for." },
      { q: "Do I need any prior English knowledge?", a: "No, we have a dedicated beginner track that starts from the basics." },
      { q: "How is this different from IELTS Speaking prep?", a: "This is for everyday fluency and confidence, not exam scoring — though it's a great foundation before IELTS/PTE." },
    ],
  },
  {
    slug: "german",
    name: "German A1–B1",
    icon: "🇩🇪",
    tagline: "Structured German for study and work visas — A1 through B1.",
    description:
      "A complete German language curriculum taking you from zero to B1 level, the benchmark most study and work visa applications require. Covers grammar, vocabulary, and speaking practice with the same structured, Punjabi-explained teaching style as our English courses — and the same daily practice model through the Pioneer Education app.",
    modules: [
      { title: "A1 — Foundations", desc: "Greetings, numbers, basic grammar (articles, cases), and everyday vocabulary." },
      { title: "A2 — Building Blocks", desc: "Past tense, more complex sentences, and expanded vocabulary for daily situations." },
      { title: "B1 — Fluency Threshold", desc: "The level most visa and university applications require — conversational fluency and complex grammar." },
      { title: "Exam Preparation", desc: "Goethe-Institut format practice tests and speaking exam simulation." },
    ],
    forWhom: [
      "Students applying to German universities",
      "Those pursuing German work visas (Ausbildung, skilled worker routes)",
      "Complete beginners — no prior German needed",
    ],
    duration: "Structured A1 → A2 → B1 progression, typically 6–9 months total",
    plans: [
      ...plans([1499, 3999, 7999], [3999, 9499, 18999], "A1"),
      ...plans([2499, 4999, 9999], [5999, 11999, 24999], "A2"),
      ...plans([3499, "soon", "soon"], [7999, "soon", "soon"], "B1"),
    ],
    faqs: [
      { q: "Do I need any German background to start?", a: "No, the A1 track starts from absolute zero." },
      { q: "Is B1 enough for a German visa?", a: "B1 is the most commonly required level for study and work visas — we'll confirm the exact requirement for your specific visa type." },
      { q: "How is this taught differently from generic German apps?", a: "Grammar explanations in Punjabi where it helps, plus real classroom speaking practice — not just app drilling." },
    ],
  },
];

/**
 * Put a payment link on one plan. Wrap the course's plans with it, once per link:
 *   plans: withLink(plans([...], [...]), "group", "1m", "https://rzp.io/rzp/abc"),
 * For German add the level: withLink(..., "group", "1m", "https://...", "A1").
 */
export function withLink(list: Plan[], tier: Plan["tier"], term: Term, url: string, level?: string): Plan[] {
  return list.map((p) =>
    p.tier === tier && p.term === term && (level ? p.level === level : true) ? { ...p, payLink: url } : p,
  );
}

export const TERM_MONTHS: Record<Term, number> = { "1m": 1, "3m": 3 };

/** A plan's address, e.g. "german:group:3m:A1" or "ielts:self:1m:". Sent to
 *  Razorpay with the payment and read back by the webhook. */
export function planKey(courseSlug: string, p: Plan): string {
  return `${courseSlug}:${p.tier}:${p.term}:${p.level ?? ""}`;
}

/** The course and plan behind a key, or null if it no longer exists. */
export function findPlanByKey(key: string): { course: Course; plan: Plan } | null {
  for (const course of COURSES) {
    for (const plan of course.plans) {
      if (planKey(course.slug, plan) === key) return { course, plan };
    }
  }
  return null;
}

/** Can this plan be bought online: a fixed price, not "coming soon". */
export const buyable = (p: Plan) => typeof p.price === "number" && p.price > 0 && !p.comingSoon;

/** Which course and plan a Razorpay payment link belongs to, for the webhook. */
export function findPlanByLink(url: string): { course: Course; plan: Plan } | null {
  const norm = (u: string) => u.trim().replace(/\/+$/, "").replace(/^http:/, "https:").toLowerCase();
  const want = norm(url);
  for (const course of COURSES) {
    for (const plan of course.plans) {
      if (plan.payLink && norm(plan.payLink) === want) return { course, plan };
    }
  }
  return null;
}

export function getCourse(slug: string) {
  return COURSES.find((c) => c.slug === slug);
}
