import { weakest, type AreaSummary } from "@/lib/skill-summary";

/* One card per skill — latest, best and average band, how many done, and a
   small line showing which way it is going. No hooks, so it renders inside
   the results page (server) and the teacher page (client) alike. */

const tone = (b: number) => (b >= 7 ? "hi" : b >= 5.5 ? "mid" : "lo");

function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return <div className="sk-spark sk-spark-none">trend after 2 attempts</div>;
  const W = 120, H = 34, pad = 3;
  const lo = Math.min(...points) - 0.25, hi = Math.max(...points) + 0.25;
  const x = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const y = (b: number) => pad + (1 - (b - lo) / Math.max(0.5, hi - lo)) * (H - pad * 2);
  const d = points.map((b, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(b).toFixed(1)}`).join(" ");
  const last = points.length - 1;
  return (
    <svg className="sk-spark" viewBox={`0 0 ${W} ${H}`} role="img"
         aria-label={`Bands from ${points[0]} to ${points[last]} over ${points.length} attempts`}>
      <path d={d} fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(points[last])} r="3" fill="var(--coral)" />
    </svg>
  );
}

export default function SkillCards({ areas, who = "you" }: { areas: AreaSummary[]; who?: "you" | "student" }) {
  if (!areas.length) return null;
  const focus = weakest(areas);
  return (
    <>
      <div className="sk-grid">
        {areas.map((a) => {
          const change = a.points.length >= 2 ? a.latest - a.points[0] : 0;
          return (
            <div className={"sk-card" + (focus?.weak.key === a.key ? " sk-weak" : "")} key={a.key}>
              <div className="sk-top">
                <span className="sk-name">{a.label}</span>
                {focus?.weak.key === a.key && <span className="sk-tag">work on this</span>}
              </div>
              <div className="sk-main">
                <span className={"sk-big pr-band " + tone(a.latest)}>
                  <span className="lb">latest</span>{a.latest.toFixed(1)}
                </span>
                <Spark points={a.points} />
              </div>
              <div className="sk-nums">
                <span><b>{a.best.toFixed(1)}</b> best</span>
                <span><b>{a.avg.toFixed(1)}</b> average</span>
                <span><b>{a.count}</b> {a.count === 1 ? "attempt" : "attempts"}</span>
                {change !== 0 && (
                  <span className={change > 0 ? "sk-up" : "sk-down"}>
                    {change > 0 ? "↑" : "↓"}{Math.abs(change).toFixed(1)} since first
                  </span>
                )}
              </div>
              {a.note && <div className="sk-note">{a.note}</div>}
            </div>
          );
        })}
      </div>
      {focus && (
        <div className="pr-note">
          <b>{who === "you" ? "Work on" : "Weakest skill:"} {focus.weak.label}{who === "you" ? " first." : "."}</b>{" "}
          {who === "you" ? "Your" : "Their"} average there is {focus.weak.avg.toFixed(1)}, against{" "}
          {focus.strong.avg.toFixed(1)} in {focus.strong.label}. In IELTS the overall band is the
          average of all four skills, so the lowest one costs the most.
        </div>
      )}
    </>
  );
}
