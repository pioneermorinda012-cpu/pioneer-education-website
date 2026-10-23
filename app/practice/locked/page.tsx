import Link from "next/link";
import { requireStudent } from "@/lib/guard";
import { AREAS, getAccessRow, type Area } from "@/lib/access";

export const dynamic = "force-dynamic";

/* Where a student lands when they open a module their login does not
   include — a GT student following an Academic link, or a student whose
   paid month has run out. It says what their login opens, what has ended,
   and where to renew. */

const COURSE_OF: Record<Area, string> = {
  academic: "ielts", gt: "ielts", english: "spoken-english", pte: "pte", german: "german",
};

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function Locked() {
  const s = await requireStudent("/practice");
  const mine = AREAS.filter((a) => !Array.isArray(s.access) || s.access.includes(a.key));

  // What has run out — read fresh, not from the sign-in cookie.
  let ended: { key: Area; label: string; on: string }[] = [];
  if (s.role === "student") {
    try {
      const row = await getAccessRow(s.sid);
      if (row) {
        ended = AREAS.filter((a) => row.access.includes(a.key) && row.until[a.key] &&
          Date.parse(row.until[a.key]!) <= Date.now())
          .map((a) => ({ key: a.key, label: a.label, on: row.until[a.key]! }));
      }
    } catch { /* the page still says what is open */ }
  }
  const renew = [...new Set(ended.map((e) => COURSE_OF[e.key]))];

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 40, paddingBottom: 60 }}>
      <div className="pr-head"><h1>{ended.length && !mine.length ? "Your access has ended" : "Not part of your course"}</h1></div>

      {ended.length > 0 && (
        <div className="pr-note">
          {ended.map((e) => (
            <div key={e.key}><b>{e.label}</b> ended on {day(e.on)}.</div>
          ))}
          <div style={{ marginTop: 8 }}>
            Renew to open it again — your results and saved writing are all still here.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {renew.map((slug) => (
              <Link key={slug} className="btn btn-coral" href={`/courses/${slug}#fees`}>
                Renew {slug === "ielts" ? "IELTS" : slug === "pte" ? "PTE" : slug === "german" ? "German" : "English"}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="pr-note">
        Your login (<b>{s.code}</b>) opens{" "}
        {mine.length ? <b>{mine.map((a) => a.label).join(", ")}</b> : "no modules right now"}.
        {!ended.length && <> The page you tried belongs to a different course.</>} If you think something should be
        open for you, ask at the centre and the teacher will add it — then sign out and sign in again.
      </div>
      <div className="pr-rows" style={{ marginTop: 18 }}>
        {mine.map((a) => (
          <div className="pr-row" key={a.key}>
            <div><div className="nm">{a.label}</div></div>
            <span />
            <div className="go"><Link className="btn btn-coral" href={a.home}>Open</Link></div>
          </div>
        ))}
      </div>
    </div>
  );
}
