/* A plain inline SVG — no chart library, nothing to load, and it renders
   identically on a phone and a classroom projector. */
export default function Trend({ points }: { points: { band: number; label: string }[] }) {
  if (points.length < 2) {
    return (
      <div className="pr-note" style={{ marginTop: 0 }}>
        One test done so far. The progress line appears once you have finished a second.
      </div>
    );
  }

  const W = 640, H = 200, padL = 34, padR = 12, padT = 14, padB = 28;
  const lo = Math.max(0, Math.min(...points.map((p) => p.band)) - 0.5);
  const hi = Math.min(9, Math.max(...points.map((p) => p.band)) + 0.5);
  const span = Math.max(0.5, hi - lo);

  const x = (i: number) => padL + (i / (points.length - 1)) * (W - padL - padR);
  const y = (b: number) => padT + (1 - (b - lo) / span) * (H - padT - padB);

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.band).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - padB} L${padL},${H - padB} Z`;

  const ticks: number[] = [];
  for (let b = Math.ceil(lo * 2) / 2; b <= hi; b += 0.5) ticks.push(b);

  return (
    <div className="pr-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img"
           aria-label={`Band score across ${points.length} tests, most recent ${points[points.length - 1].band}`}>
        {ticks.map((b) => (
          <g key={b}>
            <line x1={padL} y1={y(b)} x2={W - padR} y2={y(b)} stroke="currentColor" strokeWidth="1" opacity="0.12" />
            <text x={padL - 7} y={y(b) + 3.5} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.55">
              {b.toFixed(1)}
            </text>
          </g>
        ))}
        <path d={area} fill="var(--coral)" opacity="0.10" />
        <path d={line} fill="none" stroke="var(--coral)" strokeWidth="2.5"
              strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.band)} r="4.5" fill="#fff" stroke="var(--coral)" strokeWidth="2.5" />
            <title>{p.label}: band {p.band.toFixed(1)}</title>
          </g>
        ))}
        <text x={padL} y={H - 8} fontSize="10" fill="currentColor" opacity="0.55">{points[0].label}</text>
        <text x={W - padR} y={H - 8} fontSize="10" textAnchor="end" fill="currentColor" opacity="0.55">
          {points[points.length - 1].label}
        </text>
      </svg>
    </div>
  );
}
