export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map(([label, color]) => (
        <span key={label}>
          {color && <i style={{ background: color }} />}
          {label}
        </span>
      ))}
    </div>
  )
}

// Horizontal grouped bars. groups: [{name, v:[...]}], series: [[label, color], ...]
export function HBars({ groups, series }) {
  const W = 640, rowH = 26, gap = 12, L = 88, R = 70
  const H = groups.length * (rowH * series.length + gap) + 30
  const mx = Math.max(1, ...groups.flatMap((g) => g.v))
  return (
    <svg className="svgbox" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bar chart">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const x = L + f * (W - L - R)
        return (
          <g key={f}>
            <line x1={x} x2={x} y1={0} y2={H - 24} stroke="var(--line)" strokeWidth="1" />
            <text x={x} y={H - 8} fill="var(--mut)" fontSize="11" textAnchor="middle">{Math.round(f * mx)}</text>
          </g>
        )
      })}
      {groups.map((g, gi) => {
        const y0 = gi * (rowH * series.length + gap) + 4
        return (
          <g key={g.name}>
            <text x={L - 8} y={y0 + (rowH * series.length) / 2 + 4} fill="var(--fg)" fontSize="12" textAnchor="end">{g.name}</text>
            {g.v.map((v, si) => {
              const w = (v / mx) * (W - L - R)
              const y = y0 + si * rowH
              return (
                <g key={si}>
                  <rect x={L} y={y} width={Math.max(w, 1)} height={rowH - 5} rx="2" style={{ fill: series[si][1] }} />
                  <text x={L + w + 6} y={y + rowH - 11} fill="var(--fg)" fontSize="11">{v}</text>
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
