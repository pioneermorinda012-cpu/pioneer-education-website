/**
 * Writing Task 1 (Academic) lessons — one per chart type, each with its video.
 * The lesson pages are self-contained HTML in content/learn, served whole
 * behind the student sign-in (app/practice/learn/[id]/route.ts), like the
 * English and German trainers. `chartType` matches CHART_TYPES in
 * lib/writing.ts, so the Task 1 library can point each chart type at its
 * lesson, and each lesson at its practice tasks.
 */
export type Lesson = {
  id: string;
  file: string;
  title: string;
  chartType: string;
  blurb: string;
  video: string;
};

export const LESSONS: Lesson[] = [
  { id: "line-graph", file: "line-graph.html", title: "Line graphs", chartType: "Line graph",
    blurb: "Trends over time: rise, fall, peak, plateau — the right tense, and linking events in order.",
    video: "https://youtu.be/569R2eXnsdc" },
  { id: "bar-chart", file: "bar-chart.html", title: "Bar charts", chartType: "Bar chart",
    blurb: "Comparing: comparatives, superlatives, whereas / while, and rounding numbers.",
    video: "https://youtu.be/3ag7ColxOX4" },
  { id: "pie-chart", file: "pie-chart.html", title: "Pie charts", chartType: "Pie chart",
    blurb: "Proportions: fractions, “accounted for”, “the remaining x%”.",
    video: "https://youtu.be/Qk7-71WmfIA" },
  { id: "table", file: "table.html", title: "Tables", chartType: "Table",
    blurb: "Choosing which numbers matter, and grouping them.",
    video: "https://youtu.be/0u2cmZlSytc" },
  { id: "process", file: "process.html", title: "Process diagrams", chartType: "Process diagram",
    blurb: "The passive, sequencing words, and describing tools and methods.",
    video: "https://youtu.be/4-4vFnXtRYw" },
  { id: "map", file: "map.html", title: "Maps", chartType: "Map / plan",
    blurb: "Where things are, and how a place has changed or will change.",
    video: "https://youtu.be/gP-q6mTx55k" },
];

export const lesson = (id: string) => LESSONS.find((l) => l.id === id) ?? null;
export const lessonForType = (chartType?: string) =>
  chartType ? LESSONS.find((l) => l.chartType === chartType) ?? null : null;

/** The id from any normal YouTube link: watch?v=, youtu.be/, shorts/, embed/. */
export function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/i);
  return m ? m[1] : null;
}
