export type Course = {
  slug: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  modules: { title: string; desc: string }[];
  forWhom: string[];
  duration: string;
  faqs: { q: string; a: string }[];
};

export const COURSES: Course[] = [
  {
    slug: "ielts",
    name: "IELTS Coaching",
    icon: "âœˆï¸",
    tagline: "Academic & General Training â€” full preparation for all four modules.",
    description:
      "Our IELTS course covers Listening, Reading, Writing, and Speaking with real mock tests, banded feedback, and a curriculum built around nine years of watching exactly where Punjabi students lose marks. Both Academic and General Training tracks are covered, with content tailored to whether you're headed for university admission or migration.",
    modules: [
      { title: "Listening", desc: "Note completion, multiple choice, map labelling, and matching â€” all four question types with real recorded practice tests." },
      { title: "Reading", desc: "Skimming, scanning, True/False/Not Given, matching headings, and summary completion, drilled with timed passages." },
      { title: "Writing", desc: "Task 1 (graphs, letters) and Task 2 (essays) with structure templates and Band 7+ vocabulary in context." },
      { title: "Speaking", desc: "All 3 parts practiced live with instructors, including cue card strategy and fluency coaching." },
    ],
    forWhom: [
      "Students applying to universities abroad (Academic)",
      "Those pursuing PR or work visas (General Training)",
      "Anyone needing a specific band score for immigration",
    ],
    duration: "4â€“5 hours daily, weekday batches with evening options",
    faqs: [
      { q: "How long does the course take?", a: "Most students prepare in 6â€“10 weeks depending on their starting level and target band." },
      { q: "Do you cover both Academic and General Training?", a: "Yes â€” the core skills overlap, and we tailor Reading and Writing Task 1 practice to whichever version you're taking." },
      { q: "How often are mock tests?", a: "Every Friday, with detailed written feedback so you can track real progress week to week." },
    ],
  },
  {
    slug: "pte",
    name: "PTE Coaching",
    icon: "ðŸ’»",
    tagline: "Computer-delivered test strategy, templates, and timed practice.",
    description:
      "PTE Academic is scored by AI, which means strategy and templates matter as much as raw English ability. Our course covers every task type across Speaking, Writing, Reading, and Listening, with a strong focus on the scoring algorithm's patterns â€” what it rewards, what it penalizes, and how to structure answers accordingly.",
    modules: [
      { title: "Speaking & Writing", desc: "Read Aloud, Repeat Sentence, Describe Image, Retell Lecture, and essay writing with proven templates." },
      { title: "Reading", desc: "Fill in the blanks, reorder paragraphs, and multiple choice, practiced against the clock." },
      { title: "Listening", desc: "Summarize spoken text, fill in the blanks, and highlight correct summary â€” pattern recognition for AI scoring." },
      { title: "Exam Strategy", desc: "Time management across the full test and how to navigate the exact exam interface." },
    ],
    forWhom: [
      "Students who want a faster result than IELTS typically allows",
      "Applicants to Australia, New Zealand, and Canada (widely accepted)",
      "Those more comfortable with computer-based testing",
    ],
    duration: "Flexible batches â€” typically 3â€“6 weeks",
    faqs: [
      { q: "Is PTE easier than IELTS?", a: "Not easier exactly, but more predictable â€” since it's AI-scored, strong templates and strategy consistently produce reliable results." },
      { q: "How fast are PTE results?", a: "Usually within 1â€“2 business days, much faster than IELTS." },
      { q: "Do you provide practice on the real test software?", a: "Yes, our timed practice matches the actual PTE Academic interface." },
    ],
  },
  {
    slug: "spoken-english",
    name: "Spoken English",
    icon: "ðŸ—£ï¸",
    tagline: "Confidence-first speaking practice for daily life, interviews, and work.",
    description:
      "This course is built for students who understand English but freeze when they need to speak it. We focus on breaking the habit of translating from Punjabi/Hindi in your head, building real conversational fluency through daily speaking practice, grammar in context, and vocabulary you'll actually use â€” not just textbook lists.",
    modules: [
      { title: "Grammar in Context", desc: "Simple Present through Conditionals, taught through speaking practice rather than isolated drills." },
      { title: "Vocabulary & Idioms", desc: "250+ everyday words and common idioms, drilled with visual presentations and games." },
      { title: "Pronunciation", desc: "Word and sentence stress, plus common sounds that trip up Punjabi speakers specifically." },
      { title: "Real Conversation", desc: "Interviews, phone calls, workplace English, and everyday situations â€” practiced live, not scripted." },
    ],
    forWhom: [
      "Complete beginners building English from scratch",
      "Intermediate speakers who want to sound more natural",
      "Anyone preparing for job interviews or workplace communication",
    ],
    duration: "Beginner to Advanced, self-paced batches",
    faqs: [
      { q: "I understand English but can't speak it â€” is this for me?", a: "Yes, this is exactly who the course is designed for." },
      { q: "Do I need any prior English knowledge?", a: "No, we have a dedicated beginner track that starts from the basics." },
      { q: "How is this different from IELTS Speaking prep?", a: "This is for everyday fluency and confidence, not exam scoring â€” though it's a great foundation before IELTS/PTE." },
    ],
  },
  {
    slug: "german",
    name: "German A1â€“B1",
    icon: "ðŸ‡©ðŸ‡ª",
    tagline: "Structured German for study and work visas â€” A1 through B1.",
    description:
      "A complete German language curriculum taking you from zero to B1 level, the benchmark most study and work visa applications require. Covers grammar, vocabulary, and speaking practice with the same structured, Punjabi-explained teaching style as our English courses â€” and the same daily practice model through the Lexio app.",
    modules: [
      { title: "A1 â€” Foundations", desc: "Greetings, numbers, basic grammar (articles, cases), and everyday vocabulary." },
      { title: "A2 â€” Building Blocks", desc: "Past tense, more complex sentences, and expanded vocabulary for daily situations." },
      { title: "B1 â€” Fluency Threshold", desc: "The level most visa and university applications require â€” conversational fluency and complex grammar." },
      { title: "Exam Preparation", desc: "Goethe-Institut format practice tests and speaking exam simulation." },
    ],
    forWhom: [
      "Students applying to German universities",
      "Those pursuing German work visas (Ausbildung, skilled worker routes)",
      "Complete beginners â€” no prior German needed",
    ],
    duration: "Structured A1 â†’ A2 â†’ B1 progression, typically 6â€“9 months total",
    faqs: [
      { q: "Do I need any German background to start?", a: "No, the A1 track starts from absolute zero." },
      { q: "Is B1 enough for a German visa?", a: "B1 is the most commonly required level for study and work visas â€” we'll confirm the exact requirement for your specific visa type." },
      { q: "How is this taught differently from generic German apps?", a: "Grammar explanations in Punjabi where it helps, plus real classroom speaking practice â€” not just app drilling." },
    ],
  },
];

export function getCourse(slug: string) {
  return COURSES.find((c) => c.slug === slug);
}

