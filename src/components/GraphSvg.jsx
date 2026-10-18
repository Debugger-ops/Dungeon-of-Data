import { EDGES, NODES, POS, ek } from '../lib/graph'

export default function GraphSvg({ roles, w, pick, hiEdges, onNode }) {
  return (
    <svg className="svgbox gr" viewBox="0 0 640 320" role="img" aria-label="Graph">
      {EDGES.map(([a, b]) => {
        const [x1, y1] = POS[a]
        const [x2, y2] = POS[b]
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2
        const hi = hiEdges && hiEdges.has(ek(a, b))
        return (
          <g key={a + b}>
            <line className={`e ${hi ? 'hi' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} />
            {w && (
              <>
                <rect className="wb" x={mx - 11} y={my - 9} width="22" height="18" rx="3" />
                <text className="wt" x={mx} y={my} dy=".35em">{w[ek(a, b)]}</text>
              </>
            )}
          </g>
        )
      })}
      {NODES.map((n) => {
        const [x, y] = POS[n]
        const r = roles[n] || ''
        return (
          <g key={n} className={`n ${r} ${pick && r !== 'done' ? 'pick' : ''}`} onClick={() => onNode && onNode(n)}>
            <circle cx={x} cy={y} r="19" />
            <text x={x} y={y} dy=".35em">{n}</text>
          </g>
        )
      })}
    </svg>
  )
}
