import Link from "next/link";
import { requireStudent } from "@/lib/guard";
import { AREAS } from "@/lib/access";

export const dynamic = "force-dynamic";

/* Where a student lands when they open a module their login does not include —
   a GT student following an Academic link, say. It tells them what their
   login does open, and how to get the rest. */
export default async function Locked() {
  const s = await requireStudent("/practice");
  const mine = AREAS.filter((a) => !Array.isArray(s.access) || s.access.includes(a.key));

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 40, paddingBottom: 60 }}>
      <div className="pr-head"><h1>Not part of your course</h1></div>
      <div className="pr-note">
        Your login (<b>{s.code}</b>) opens{" "}
        {mine.length ? <b>{mine.map((a) => a.label).join(", ")}</b> : "no modules yet"}.
        The page you tried belongs to a different course. If you think it should be open for you,
        ask at the centre and the teacher will add it — then sign out and sign in again.
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
