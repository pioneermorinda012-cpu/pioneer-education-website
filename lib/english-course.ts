/**
 * The English Grammar & Vocabulary course: Narinder's lesson pages, arranged
 * from the basics (A1) to IELTS Speaking (B1–B2). Each lesson is a whole page
 * in content/english-course/<id>.html, served by
 * app/practice/english/course/[lesson]/route.ts, which adds the video, the
 * "next lesson" button and progress saving. The course page is
 * app/practice/english/course/page.tsx.
 *
 * To add a YouTube video to a lesson, put its link in VIDEOS below under the
 * lesson's id (shown at the end of the lesson's web address), e.g.
 *   "articles-1": "https://youtu.be/XXXXXXXXXXX",
 */
export type CourseLesson = { id: string; title: string; test: boolean; questions: number };
export type CourseUnit = { key: string; title: string; lessons: CourseLesson[] };
export type CourseStage = { title: string; level: string; units: CourseUnit[] };

export const COURSE: CourseStage[] = [
 {
  "title": "Stage 1 · The basics",
  "level": "A1",
  "units": [
   {
    "key": "be",
    "title": "The verb “to be” & Present Simple",
    "lessons": [
     {
      "id": "be-1",
      "title": "The Verb “To Be”: am, is, are",
      "test": false,
      "questions": 28
     },
     {
      "id": "be-2",
      "title": "Present Simple: Positive",
      "test": false,
      "questions": 53
     },
     {
      "id": "be-3",
      "title": "Present Simple: Negatives & Questions",
      "test": false,
      "questions": 60
     },
     {
      "id": "be-4",
      "title": "Present Simple: Translate Punjabi → English",
      "test": false,
      "questions": 15
     },
     {
      "id": "be-5",
      "title": "Present Simple Passive",
      "test": false,
      "questions": 35
     }
    ]
   },
   {
    "key": "has",
    "title": "Has / Have",
    "lessons": [
     {
      "id": "has-1",
      "title": "Has or Have?",
      "test": false,
      "questions": 47
     },
     {
      "id": "has-2",
      "title": "Have: Negatives & Questions",
      "test": false,
      "questions": 34
     }
    ]
   },
   {
    "key": "articles",
    "title": "Articles: a, an, the",
    "lessons": [
     {
      "id": "articles-1",
      "title": "A or An?",
      "test": false,
      "questions": 27
     },
     {
      "id": "articles-2",
      "title": "The (Definite Article)",
      "test": false,
      "questions": 18
     },
     {
      "id": "articles-3",
      "title": "No Article (Zero Article)",
      "test": false,
      "questions": 18
     },
     {
      "id": "articles-4",
      "title": "Articles — Mixed Practice 1",
      "test": false,
      "questions": 53
     },
     {
      "id": "articles-5",
      "title": "Articles — Mixed Practice 2",
      "test": false,
      "questions": 40
     },
     {
      "id": "articles-6",
      "title": "Articles — Mixed Practice 3",
      "test": false,
      "questions": 36
     },
     {
      "id": "articles-7",
      "title": "Articles — Mixed Practice 4",
      "test": false,
      "questions": 60
     },
     {
      "id": "articles-8",
      "title": "Articles — Final Test",
      "test": true,
      "questions": 20
     }
    ]
   },
   {
    "key": "plural",
    "title": "Singular & Plural",
    "lessons": [
     {
      "id": "plural-1",
      "title": "Regular Plurals",
      "test": false,
      "questions": 52
     },
     {
      "id": "plural-2",
      "title": "Irregular Plurals",
      "test": false,
      "questions": 23
     },
     {
      "id": "plural-3",
      "title": "Academic Plurals",
      "test": false,
      "questions": 40
     },
     {
      "id": "plural-4",
      "title": "Compound & Special Nouns",
      "test": false,
      "questions": 37
     },
     {
      "id": "plural-5",
      "title": "Singular & Plural — Final Test",
      "test": true,
      "questions": 64
     }
    ]
   },
   {
    "key": "pronouns",
    "title": "Pronouns",
    "lessons": [
     {
      "id": "pronouns-1",
      "title": "What is a Pronoun?",
      "test": false,
      "questions": 38
     },
     {
      "id": "pronouns-2",
      "title": "Subject & Object Pronouns",
      "test": false,
      "questions": 25
     },
     {
      "id": "pronouns-3",
      "title": "Possessives: my or mine?",
      "test": false,
      "questions": 26
     },
     {
      "id": "pronouns-4",
      "title": "Reflexive Pronouns",
      "test": false,
      "questions": 73
     },
     {
      "id": "pronouns-5",
      "title": "This, That, These, Those",
      "test": false,
      "questions": 15
     },
     {
      "id": "pronouns-6",
      "title": "Using Pronouns Correctly",
      "test": false,
      "questions": 22
     },
     {
      "id": "pronouns-7",
      "title": "Question Words",
      "test": false,
      "questions": 26
     },
     {
      "id": "pronouns-8",
      "title": "Indefinite Pronouns",
      "test": false,
      "questions": 30
     },
     {
      "id": "pronouns-9",
      "title": "Relative Pronouns",
      "test": false,
      "questions": 31
     },
     {
      "id": "pronouns-10",
      "title": "Pronouns — Final Test",
      "test": true,
      "questions": 40
     }
    ]
   },
   {
    "key": "routine",
    "title": "My Daily Routine",
    "lessons": [
     {
      "id": "routine-1",
      "title": "My Daily Routine",
      "test": false,
      "questions": 43
     }
    ]
   }
  ]
 },
 {
  "title": "Stage 2 · Everyday grammar",
  "level": "A2",
  "units": [
   {
    "key": "verbs",
    "title": "Forms of the Verb",
    "lessons": [
     {
      "id": "verbs-1",
      "title": "The Three Forms of the Verb",
      "test": false,
      "questions": 44
     },
     {
      "id": "verbs-2",
      "title": "Irregular Verbs Practice",
      "test": false,
      "questions": 51
     }
    ]
   },
   {
    "key": "had",
    "title": "Had & Had + V3",
    "lessons": [
     {
      "id": "had-1",
      "title": "Had: Past of Have · Had To",
      "test": false,
      "questions": 21
     },
     {
      "id": "had-2",
      "title": "Had + V3: The Past Perfect",
      "test": false,
      "questions": 17
     }
    ]
   },
   {
    "key": "adverbs",
    "title": "Adverbs",
    "lessons": [
     {
      "id": "adverbs-1",
      "title": "What Is an Adverb? · Adverbs of Manner",
      "test": false,
      "questions": 51
     },
     {
      "id": "adverbs-2",
      "title": "Adjective or Adverb?",
      "test": false,
      "questions": 76
     },
     {
      "id": "adverbs-3",
      "title": "Adverbs of Frequency",
      "test": false,
      "questions": 31
     },
     {
      "id": "adverbs-4",
      "title": "Degree, Place & Time · already, still, yet",
      "test": false,
      "questions": 49
     },
     {
      "id": "adverbs-5",
      "title": "Opinion Adverbs & Strong Adjectives",
      "test": false,
      "questions": 32
     },
     {
      "id": "adverbs-6",
      "title": "Adverbs: Final Test",
      "test": true,
      "questions": 20
     }
    ]
   },
   {
    "key": "review5",
    "title": "Review Test",
    "lessons": [
     {
      "id": "review5-1",
      "title": "Week 5 Review Test",
      "test": true,
      "questions": 40
     }
    ]
   },
   {
    "key": "commands",
    "title": "Commands & Requests",
    "lessons": [
     {
      "id": "commands-1",
      "title": "Commands & Orders",
      "test": false,
      "questions": 26
     },
     {
      "id": "commands-2",
      "title": "Reported Commands & Requests",
      "test": false,
      "questions": 24
     }
    ]
   },
   {
    "key": "permission",
    "title": "Asking Permission",
    "lessons": [
     {
      "id": "permission-1",
      "title": "Asking Permission & Making Requests",
      "test": false,
      "questions": 37
     }
    ]
   },
   {
    "key": "makedo",
    "title": "Make, Do & Get",
    "lessons": [
     {
      "id": "makedo-1",
      "title": "Make or Do?",
      "test": false,
      "questions": 60
     },
     {
      "id": "makedo-2",
      "title": "Uses of GET",
      "test": false,
      "questions": 21
     }
    ]
   }
  ]
 },
 {
  "title": "Stage 3 · Time, place & quantity",
  "level": "A2–B1",
  "units": [
   {
    "key": "prep",
    "title": "Prepositions",
    "lessons": [
     {
      "id": "prep-1",
      "title": "Prepositions of Time",
      "test": false,
      "questions": 43
     },
     {
      "id": "prep-2",
      "title": "Place, Position & Transport",
      "test": false,
      "questions": 22
     },
     {
      "id": "prep-3",
      "title": "Asking & Giving Directions",
      "test": false,
      "questions": 18
     },
     {
      "id": "prep-4",
      "title": "Adjective & Verb + Preposition",
      "test": false,
      "questions": 40
     },
     {
      "id": "prep-5",
      "title": "Prepositions with Nouns",
      "test": false,
      "questions": 54
     },
     {
      "id": "prep-6",
      "title": "Fixed Phrases with Prepositions",
      "test": false,
      "questions": 32
     },
     {
      "id": "prep-7",
      "title": "Mixed Practice 1",
      "test": false,
      "questions": 50
     },
     {
      "id": "prep-8",
      "title": "Mixed Practice 2",
      "test": false,
      "questions": 46
     },
     {
      "id": "prep-9",
      "title": "Mixed Practice 3",
      "test": false,
      "questions": 45
     },
     {
      "id": "prep-10",
      "title": "Mixed Practice 4",
      "test": false,
      "questions": 45
     },
     {
      "id": "prep-11",
      "title": "Prepositions — Final Test",
      "test": true,
      "questions": 30
     }
    ]
   },
   {
    "key": "quant",
    "title": "Quantifiers: much, many, few, little",
    "lessons": [
     {
      "id": "quant-1",
      "title": "How Much or How Many?",
      "test": false,
      "questions": 59
     },
     {
      "id": "quant-2",
      "title": "Much, Many & A Lot Of",
      "test": false,
      "questions": 20
     },
     {
      "id": "quant-3",
      "title": "Some & Any",
      "test": false,
      "questions": 44
     },
     {
      "id": "quant-4",
      "title": "Few, A Few, Little, A Little",
      "test": false,
      "questions": 22
     },
     {
      "id": "quant-5",
      "title": "Fewer & Less",
      "test": false,
      "questions": 16
     },
     {
      "id": "quant-6",
      "title": "All, Every, Each, Both, Either, Neither",
      "test": false,
      "questions": 22
     },
     {
      "id": "quant-7",
      "title": "Confusing Pairs",
      "test": false,
      "questions": 22
     },
     {
      "id": "quant-8",
      "title": "Too Much, Too Many, Enough",
      "test": false,
      "questions": 39
     },
     {
      "id": "quant-9",
      "title": "Quantifiers — Final Test",
      "test": true,
      "questions": 24
     }
    ]
   }
  ]
 },
 {
  "title": "Stage 4 · Describing & comparing",
  "level": "B1",
  "units": [
   {
    "key": "adj",
    "title": "Adjectives",
    "lessons": [
     {
      "id": "adj-1",
      "title": "What is an Adjective?",
      "test": false,
      "questions": 28
     },
     {
      "id": "adj-2",
      "title": "Degrees of Comparison",
      "test": false,
      "questions": 33
     },
     {
      "id": "adj-3",
      "title": "Order of Adjectives",
      "test": false,
      "questions": 12
     },
     {
      "id": "adj-4",
      "title": "Making Adjectives",
      "test": false,
      "questions": 37
     },
     {
      "id": "adj-5",
      "title": "-ed / -ing Adjectives",
      "test": false,
      "questions": 28
     },
     {
      "id": "adj-6",
      "title": "Strong Adjectives",
      "test": false,
      "questions": 28
     },
     {
      "id": "adj-7",
      "title": "Adjectives — Final Test",
      "test": true,
      "questions": 20
     }
    ]
   },
   {
    "key": "adjbank",
    "title": "Adjective Word Bank",
    "lessons": [
     {
      "id": "adjbank-1",
      "title": "Adjectives for Feelings",
      "test": false,
      "questions": 65
     },
     {
      "id": "adjbank-2",
      "title": "Adjectives for Personality",
      "test": false,
      "questions": 66
     },
     {
      "id": "adjbank-3",
      "title": "Describing Things",
      "test": false,
      "questions": 88
     }
    ]
   },
   {
    "key": "compare",
    "title": "Comparatives & Superlatives",
    "lessons": [
     {
      "id": "compare-1",
      "title": "Comparatives & Superlatives: Practice",
      "test": false,
      "questions": 56
     },
     {
      "id": "compare-2",
      "title": "Comparative or Superlative?",
      "test": false,
      "questions": 49
     },
     {
      "id": "compare-3",
      "title": "Tricky Comparisons",
      "test": false,
      "questions": 19
     }
    ]
   },
   {
    "key": "descpres",
    "title": "Describing in the Present",
    "lessons": [
     {
      "id": "descpres-1",
      "title": "Describing in the Present",
      "test": false,
      "questions": 22
     },
     {
      "id": "descpres-2",
      "title": "Translate: Punjabi → English",
      "test": false,
      "questions": 21
     },
     {
      "id": "descpres-3",
      "title": "Describing People & Places",
      "test": false,
      "questions": 63
     }
    ]
   },
   {
    "key": "descpast",
    "title": "Describing in the Past",
    "lessons": [
     {
      "id": "descpast-1",
      "title": "Describing in the Past",
      "test": false,
      "questions": 30
     },
     {
      "id": "descpast-2",
      "title": "Past Description: Translate & Write",
      "test": false,
      "questions": 15
     }
    ]
   }
  ]
 },
 {
  "title": "Stage 5 · Vocabulary & IELTS Speaking",
  "level": "B1–B2",
  "units": [
   {
    "key": "opp",
    "title": "Opposite Words",
    "lessons": [
     {
      "id": "opp-1",
      "title": "Everyday Opposites",
      "test": false,
      "questions": 73
     },
     {
      "id": "opp-2",
      "title": "Opposites with Prefixes",
      "test": false,
      "questions": 60
     },
     {
      "id": "opp-3",
      "title": "Intermediate Opposites",
      "test": false,
      "questions": 76
     },
     {
      "id": "opp-4",
      "title": "Advanced Opposites",
      "test": false,
      "questions": 65
     },
     {
      "id": "opp-5",
      "title": "Opposite Words — Final Test",
      "test": true,
      "questions": 35
     }
    ]
   },
   {
    "key": "syn",
    "title": "Synonyms",
    "lessons": [
     {
      "id": "syn-1",
      "title": "Everyday Synonyms",
      "test": false,
      "questions": 48
     },
     {
      "id": "syn-2",
      "title": "Upgrade Your Words",
      "test": false,
      "questions": 46
     },
     {
      "id": "syn-3",
      "title": "Advanced Synonyms",
      "test": false,
      "questions": 63
     },
     {
      "id": "syn-4",
      "title": "Synonyms & Antonyms: Exam Practice",
      "test": false,
      "questions": 32
     }
    ]
   },
   {
    "key": "speak",
    "title": "IELTS Speaking Part 1",
    "lessons": [
     {
      "id": "speak-1",
      "title": "Speaking Part 1: How to Answer",
      "test": false,
      "questions": 12
     },
     {
      "id": "speak-2",
      "title": "Speaking Part 1: Question Bank",
      "test": false,
      "questions": 8
     },
     {
      "id": "speak-3",
      "title": "Speaking Part 1: Week 3 Topics",
      "test": false,
      "questions": 8
     },
     {
      "id": "speak-4",
      "title": "Speaking Part 1: Week 4 Topics",
      "test": false,
      "questions": 9
     },
     {
      "id": "speak-5",
      "title": "Speaking Part 1: Daily Life",
      "test": false,
      "questions": 7
     }
    ]
   }
  ]
 }
];

/** YouTube link per lesson id. Empty: the lesson shows no video. */
export const VIDEOS: Record<string, string> = {
  "articles-1": "https://youtu.be/QN1dnhJxu1s", // HOW TO USE ARTICLES IN ENGLISH AND IELTS
  "plural-1": "https://youtu.be/0ZQ0-pCTOo8", // How to use singular plural
  "pronouns-1": "https://youtu.be/mJY9Ip3vcKs", // HOW TO USE PRONOUNS IN ENGLISH
  "adverbs-1": "https://youtu.be/CAHuUXpyF3Q", // Using adverbs of manner in English
  "prep-1": "https://youtu.be/1PGEIFwHcio", // How to use prepositions
  "prep-3": "https://youtu.be/UjAZS6q7p5U", // LEARN HOW TO ASK AND GIVE DIRECTIONS
  "quant-3": "https://youtu.be/4nuhuE5SCG8", // How to use some and any in English
  "adj-1": "https://youtu.be/bUgF4opXeuY", // How to use adjectives in English
  "adj-4": "https://youtu.be/-3n7qRvQhCU", // How to use suffix in English
};

/** Every lesson in learning order, with where it sits. */
export const COURSE_LESSONS = COURSE.flatMap((st, si) =>
  st.units.flatMap((u) => u.lessons.map((l, li) => ({ ...l, stage: si, unit: u, n: li + 1, of: u.lessons.length }))));

export const courseLesson = (id: string) => {
  const i = COURSE_LESSONS.findIndex((l) => l.id === id);
  return i < 0 ? null : { ...COURSE_LESSONS[i], next: COURSE_LESSONS[i + 1] ?? null };
};

/** Where each browser keeps its course progress (synced to the account, lib/trainer-page.ts). */
export const COURSE_TRAINER = "course/english";
export const COURSE_KEY = "pioneer-en-course";
/** Progress per lesson id: best score, questions answered, questions in the lesson. */
export type CourseProgress = Record<string, { s: number; d: number; t: number }>;
