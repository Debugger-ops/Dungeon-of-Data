import { useRef, useState } from 'react'

export const fmt = (v) => (v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : v >= 1e4 ? `${+(v / 1e3).toFixed(0)}k` : v >= 1e3 ? `${+(v / 1e3).toFixed(1)}k` : `${Math.round(v * 10) / 10}`)

// Convert a pointer event to an x coordinate in the svg's viewBox.
function useSvgX(W) {
  const ref = useRef(null)
  const x = (e) => {
    const r = ref.current.getBoundingClientRect()
    return ((e.clientX - r.left) / r.width) * W
  }
  return [ref, x]
}

export function Empty({ children }) {
  return <div className="emptyviz">{children}</div>
}

// Spider chart: two series over the same axes. axes: [{ label, a, b }] with values 0-100.
export function Radar({ axes, aName, bName, aColor = 'var(--torch)', bColor = 'var(--arc)' }) {
  const [hov, setHov] = useState(null)
  const C = 170, R = 112, n = axes.length
  const ang = (i) => -Math.PI / 2 + (i / n) * Math.PI * 2
  const pt = (i, v) => [C + Math.cos(ang(i)) * R * (v / 100), 150 + Math.sin(ang(i)) * R * (v / 100)]
  const poly = (k) => axes.map((a, i) => pt(i, a[k]).join(',')).join(' ')
  return (
    <div>
      <svg className="svgbox" viewBox="-30 0 400 300" role="img" aria-label="Mastery radar chart" style={{ maxHeight: 320 }}>
        {[25, 50, 75, 100].map((r) => (
          <polygon key={r} points={axes.map((_, i) => pt(i, r).join(',')).join(' ')} fill="none" stroke="var(--line)" strokeWidth="1" />
        ))}
        {axes.map((a, i) => {
          const [x, y] = pt(i, 100)
          const [lx, ly] = pt(i, 122)
          return (
            <g key={a.label}>
              <line x1={C} y1={150} x2={x} y2={y} stroke="var(--line)" />
              <text x={lx} y={ly} dy=".35em" fill={hov === i ? 'var(--fg)' : 'var(--mut)'} fontSize="11" textAnchor={lx < C - 6 ? 'end' : lx > C + 6 ? 'start' : 'middle'}>{a.label}</text>
            </g>
          )
        })}
        {[25, 50, 75].map((r) => <text key={r} x={C + 3} y={150 - R * (r / 100) - 2} fill="var(--mut)" fontSize="9">{r}</text>)}
        <polygon points={poly('b')} fill={bColor} fillOpacity=".14" stroke={bColor} strokeWidth="2" strokeLinejoin="round" />
        <polygon points={poly('a')} fill={aColor} fillOpacity=".2" stroke={aColor} strokeWidth="2" strokeLinejoin="round" />
        {axes.map((a, i) => (
          <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            <circle cx={pt(i, a.a)[0]} cy={pt(i, a.a)[1]} r="4.5" fill={aColor} stroke="var(--panel)" strokeWidth="1.5"><title>{`${a.label}: ${aName} ${a.a}`}</title></circle>
            <circle cx={pt(i, a.b)[0]} cy={pt(i, a.b)[1]} r="3.5" fill={bColor} stroke="var(--panel)" strokeWidth="1.5"><title>{`${a.label}: ${bName} ${a.b}`}</title></circle>
          </g>
        ))}
      </svg>
      <div className="readout">{hov === null ? 'Hover a point for exact values.' : `${axes[hov].label}: ${aName} ${axes[hov].a}, ${bName} ${axes[hov].b}`}</div>
    </div>
  )
}

// Line + gradient area over labelled points [{ label, v }].
export function AreaLine({ pts, color = 'var(--torch)', unit = '', id = 'ar' }) {
  const W = 680, H = 230, L = 46, R = 14, T = 14, B = 28
  const pw = W - L - R, ph = H - T - B
  const [ref, toX] = useSvgX(W)
  const [hi, setHi] = useState(null)
  const mx = Math.max(1, ...pts.map((p) => p.v))
  const top = Math.max(10, Math.ceil(mx / 10) * 10)
  const x = (i) => L + (pts.length === 1 ? pw / 2 : (i / (pts.length - 1)) * pw)
  const y = (v) => T + ph - (v / top) * ph
  const line = pts.map((p, i) => `${x(i)},${y(p.v)}`).join(' ')
  const area = `${x(0)},${T + ph} ${line} ${x(pts.length - 1)},${T + ph}`
  const move = (e) => setHi(Math.max(0, Math.min(pts.length - 1, Math.round(((toX(e) - L) / pw) * (pts.length - 1)))))
  return (
    <div>
      <svg ref={ref} className="svgbox" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart" onMouseMove={move} onMouseLeave={() => setHi(null)}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".45" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={L} x2={W - R} y1={y(f * top)} y2={y(f * top)} stroke="var(--line)" />
            <text x={L - 6} y={y(f * top) + 4} fill="var(--mut)" fontSize="11" textAnchor="end">{fmt(f * top)}</text>
          </g>
        ))}
        {pts.map((p, i) => (i % Math.ceil(pts.length / 6) === 0 || i === pts.length - 1) && <text key={i} x={x(i)} y={H - 8} fill="var(--mut)" fontSize="11" textAnchor={i === pts.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'}>{p.label}</text>)}
        <polygon points={area} fill={`url(#${id})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {hi !== null && (
          <g>
            <line x1={x(hi)} x2={x(hi)} y1={T} y2={T + ph} stroke="var(--mut)" strokeDasharray="3 3" />
            <circle cx={x(hi)} cy={y(pts[hi].v)} r="5" fill={color} stroke="var(--bg)" strokeWidth="2" />
          </g>
        )}
      </svg>
      <div className="readout">{hi === null ? 'Hover the chart to read a day.' : `${pts[hi].label}: ${fmt(pts[hi].v)}${unit}`}</div>
    </div>
  )
}

// Calendar heatmap. cells: [{ day, n, future }] in column-major order (7 per week, Sunday first).
export function Heatmap({ cells, weeks, color = 'var(--ok)', unit = 'rounds' }) {
  const S = 17, G = 4, L = 30, T = 18
  const W = L + weeks * (S + G), H = T + 7 * (S + G)
  const op = (n) => (n <= 0 ? 0 : n === 1 ? 0.3 : n <= 3 ? 0.55 : n <= 6 ? 0.8 : 1)
  const months = []
  cells.forEach((c, i) => {
    if (i % 7 !== 0) return
    const m = Number(c.day.slice(5, 7))
    if (!months.length || months[months.length - 1].m !== m) months.push({ m, w: i / 7 })
  })
  const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return (
    <div>
      <svg className="svgbox" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Activity heatmap" style={{ width: '100%', maxWidth: W * 1.5, minWidth: 360 }}>
        {months.map((m) => <text key={m.w} x={L + m.w * (S + G)} y={11} fill="var(--mut)" fontSize="10">{MN[m.m]}</text>)}
        {['Mon', 'Wed', 'Fri'].map((d, k) => <text key={d} x={0} y={T + (k * 2 + 1) * (S + G) + S - 4} fill="var(--mut)" fontSize="10">{d}</text>)}
        {cells.map((c, i) => {
          if (c.future) return null
          const w = Math.floor(i / 7), d = i % 7
          return (
            <g key={c.day}>
              <rect x={L + w * (S + G)} y={T + d * (S + G)} width={S} height={S} rx="3" fill="var(--panel2)" stroke="var(--line)" strokeWidth=".5" />
              {c.n > 0 && <rect x={L + w * (S + G)} y={T + d * (S + G)} width={S} height={S} rx="3" fill={color} fillOpacity={op(c.n)}><title>{`${c.day}: ${c.n} ${unit}`}</title></rect>}
              {c.n === 0 && <title>{`${c.day}: none`}</title>}
            </g>
          )
        })}
      </svg>
      <div className="legend" style={{ marginTop: 6, alignItems: 'center' }}>
        <span>less</span>
        {[0, 1, 2, 4, 7].map((n) => <i key={n} style={{ background: n ? color : 'var(--panel2)', opacity: n ? op(n) : 1, border: '1px solid var(--line)', marginRight: 0 }} />)}
        <span>more</span>
      </div>
    </div>
  )
}

// Two-segment horizontal stacked bars. rows: [{ name, a, b }]
export function StackBars({ rows, aName, bName, aColor = 'var(--ok)', bColor = 'var(--bad)' }) {
  const W = 640, rh = 28, gap = 10, L = 96, R = 40
  const H = rows.length * (rh + gap) + 6
  const mx = Math.max(1, ...rows.map((r) => r.a + r.b))
  const sx = (v) => (v / mx) * (W - L - R)
  return (
    <div>
      <svg className="svgbox" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Wins and losses by room">
        {rows.map((r, i) => {
          const y = i * (rh + gap) + 2
          return (
            <g key={r.name}>
              <text x={L - 8} y={y + rh / 2 + 4} fill="var(--fg)" fontSize="12" textAnchor="end">{r.name}</text>
              <rect x={L} y={y} width={W - L - R} height={rh} rx="3" fill="var(--panel2)" />
              {r.a > 0 && <rect x={L} y={y} width={sx(r.a)} height={rh} rx="3" fill={aColor}><title>{`${r.name}: ${r.a} ${aName}`}</title></rect>}
              {r.b > 0 && <rect x={L + sx(r.a)} y={y} width={sx(r.b)} height={rh} rx="3" fill={bColor}><title>{`${r.name}: ${r.b} ${bName}`}</title></rect>}
              {r.a > 0 && sx(r.a) > 22 && <text x={L + sx(r.a) / 2} y={y + rh / 2 + 4} fill="#08150f" fontSize="12" fontWeight="600" textAnchor="middle">{r.a}</text>}
              {r.b > 0 && sx(r.b) > 22 && <text x={L + sx(r.a) + sx(r.b) / 2} y={y + rh / 2 + 4} fill="#1d0705" fontSize="12" fontWeight="600" textAnchor="middle">{r.b}</text>}
              <text x={W - R + 8} y={y + rh / 2 + 4} fill="var(--mut)" fontSize="11">{r.a + r.b ? `${Math.round((100 * r.a) / (r.a + r.b))}%` : '-'}</text>
            </g>
          )
        })}
      </svg>
      <div className="legend"><span><i style={{ background: aColor }} />{aName}</span><span><i style={{ background: bColor }} />{bName}</span><span>right: win rate</span></div>
    </div>
  )
}

// Raw points plus a rolling average. pts: [{ y, win }]
export function RollingLine({ pts, win = 5, color = 'var(--arc)' }) {
  const W = 680, H = 230, L = 46, R = 14, T = 14, B = 28
  const pw = W - L - R, ph = H - T - B
  const [ref, toX] = useSvgX(W)
  const [hi, setHi] = useState(null)
  const x = (i) => L + (pts.length === 1 ? pw / 2 : (i / (pts.length - 1)) * pw)
  const y = (v) => T + ph - (v / 100) * ph
  const roll = pts.map((_, i) => {
    const s = pts.slice(Math.max(0, i - win + 1), i + 1)
    return s.reduce((a, p) => a + p.y, 0) / s.length
  })
  const move = (e) => setHi(Math.max(0, Math.min(pts.length - 1, Math.round(((toX(e) - L) / pw) * (pts.length - 1)))))
  return (
    <div>
      <svg ref={ref} className="svgbox" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Rolling accuracy" onMouseMove={move} onMouseLeave={() => setHi(null)}>
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={L - 6} y={y(v) + 4} fill="var(--mut)" fontSize="11" textAnchor="end">{v}%</text>
          </g>
        ))}
        {pts.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.y)} r="3.5" fill={p.win ? 'var(--ok)' : 'var(--bad)'} fillOpacity=".55" />)}
        <polyline points={roll.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {hi !== null && <line x1={x(hi)} x2={x(hi)} y1={T} y2={T + ph} stroke="var(--mut)" strokeDasharray="3 3" />}
        {hi !== null && <circle cx={x(hi)} cy={y(roll[hi])} r="5" fill={color} stroke="var(--bg)" strokeWidth="2" />}
      </svg>
      <div className="readout">{hi === null ? `Line = average of the last ${win} attempts. Dots = single attempts (green win, red loss).` : `Attempt ${hi + 1}: ${Math.round(pts[hi].y)}% accuracy, rolling average ${Math.round(roll[hi])}%`}</div>
    </div>
  )
}

// Log-log growth chart with toggleable series, direct labels and a crosshair readout.
export function LogLog({ xs, series, xLabel = 'n', yLabel = '' }) {
  const W = 680, H = 320, L = 56, R = 92, T = 14, B = 38
  const pw = W - L - R, ph = H - T - B
  const [off, setOff] = useState({})
  const [hi, setHi] = useState(null)
  const [ref, toX] = useSvgX(W)
  const live = series.filter((s) => !off[s.key])
  const maxV = Math.max(10, ...live.map((s) => Math.max(...s.vals)))
  const ymax = Math.max(1, Math.ceil(Math.log10(maxV)))
  const x = (i) => L + (i / (xs.length - 1)) * pw
  const y = (v) => T + ph - (Math.log10(Math.max(v, 1)) / ymax) * ph
  const move = (e) => setHi(Math.max(0, Math.min(xs.length - 1, Math.round(((toX(e) - L) / pw) * (xs.length - 1)))))
  // direct labels at the right edge, nudged apart
  const ends = live.map((s) => ({ s, y: y(s.vals[s.vals.length - 1]) })).sort((a, b) => a.y - b.y)
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13
  return (
    <div>
      <svg ref={ref} className="svgbox" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Log-log growth chart" onMouseMove={move} onMouseLeave={() => setHi(null)}>
        {Array.from({ length: ymax + 1 }, (_, k) => (
          <g key={k}>
            <line x1={L} x2={W - R} y1={y(10 ** k)} y2={y(10 ** k)} stroke="var(--line)" />
            <text x={L - 6} y={y(10 ** k) + 4} fill="var(--mut)" fontSize="11" textAnchor="end">{fmt(10 ** k)}</text>
          </g>
        ))}
        {xs.map((v, i) => <text key={v} x={x(i)} y={H - 18} fill="var(--mut)" fontSize="11" textAnchor="middle">{v}</text>)}
        <text x={L + pw / 2} y={H - 3} fill="var(--mut)" fontSize="11" textAnchor="middle">{xLabel} (log scale)</text>
        <text x={12} y={T + ph / 2} fill="var(--mut)" fontSize="11" textAnchor="middle" transform={`rotate(-90 12 ${T + ph / 2})`}>{yLabel} (log scale)</text>
        {live.map((s) => (
          <polyline key={s.key} points={s.vals.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={s.color} strokeWidth={s.dash ? 1.5 : 2.5} strokeDasharray={s.dash ? '5 4' : undefined} strokeLinejoin="round" />
        ))}
        {hi !== null && <line x1={x(hi)} x2={x(hi)} y1={T} y2={T + ph} stroke="var(--mut)" strokeDasharray="3 3" />}
        {hi !== null && live.map((s) => <circle key={s.key} cx={x(hi)} cy={y(s.vals[hi])} r="4" fill={s.color} stroke="var(--bg)" strokeWidth="1.5" />)}
        {ends.map(({ s, y: yy }) => <text key={s.key} x={W - R + 8} y={yy + 4} fill={s.color} fontSize="11">{s.name}</text>)}
      </svg>
      <div className="readout">
        {hi === null
          ? 'Hover the chart to compare all visible series at one input size.'
          : `${xLabel} = ${xs[hi]}:  ` + [...live].sort((a, b) => b.vals[hi] - a.vals[hi]).map((s) => `${s.name} ${Number(s.vals[hi].toFixed(1)).toLocaleString()}`).join('  ·  ')}
      </div>
      <div className="chips" style={{ marginTop: 8 }}>
        {series.map((s) => (
          <button key={s.key} className={`chip ${off[s.key] ? '' : 'on'}`} onClick={() => setOff({ ...off, [s.key]: !off[s.key] })} aria-pressed={!off[s.key]} style={off[s.key] ? undefined : { borderColor: s.color, color: s.color }}>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )
}

// Linear-scale curves over a continuous x. curves: [{ name, color, dash, f }], marker: x value of the slider.
export function Curves({ curves, x0 = 0, x1 = 0.95, cap = 12, marker, xLabel = 'load factor α' }) {
  const W = 680, H = 280, L = 46, R = 14, T = 14, B = 36
  const pw = W - L - R, ph = H - T - B
  const x = (v) => L + ((v - x0) / (x1 - x0)) * pw
  const y = (v) => T + ph - (Math.min(v, cap) / cap) * ph
  const steps = 96
  return (
    <svg className="svgbox" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Expected probes versus load factor">
      {[0, 3, 6, 9, 12].filter((v) => v <= cap).map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={L - 6} y={y(v) + 4} fill="var(--mut)" fontSize="11" textAnchor="end">{v}{v === cap ? '+' : ''}</text>
        </g>
      ))}
      {[0, 0.25, 0.5, 0.75, 0.9].map((v) => <text key={v} x={x(v)} y={H - 18} fill="var(--mut)" fontSize="11" textAnchor="middle">{v}</text>)}
      <text x={L + pw / 2} y={H - 3} fill="var(--mut)" fontSize="11" textAnchor="middle">{xLabel}</text>
      {curves.map((c) => (
        <polyline key={c.name} points={Array.from({ length: steps + 1 }, (_, i) => { const v = x0 + ((x1 - x0) * i) / steps; return `${x(v)},${y(c.f(v))}` }).join(' ')} fill="none" stroke={c.color} strokeWidth="2.5" strokeDasharray={c.dash ? '6 4' : undefined} strokeLinejoin="round" />
      ))}
      <line x1={x(marker)} x2={x(marker)} y1={T} y2={T + ph} stroke="var(--torch)" strokeWidth="1.5" />
      {curves.map((c) => <circle key={c.name} cx={x(marker)} cy={y(c.f(marker))} r="4.5" fill={c.color} stroke="var(--bg)" strokeWidth="1.5" />)}
    </svg>
  )
}
