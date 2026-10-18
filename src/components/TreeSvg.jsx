import { treeLayout } from '../lib/tree'

// Draws a binary tree. With `ghosts`, empty child slots are clickable dashed circles.
export default function TreeSvg({ root, ghosts, roles, pick, onGhost, onNode }) {
  const L = treeLayout(root, ghosts)
  return (
    <svg className="svgbox tree" viewBox={`0 0 ${L.W} ${L.H}`}>
      {L.items.map((it, k) => {
        if (!it.parent) return null
        const p = L.by.get(it.parent)
        return <line key={`e${k}`} className={`e ${it.ghost ? 'g' : ''}`} x1={p.x} y1={p.y} x2={it.x} y2={it.y} />
      })}
      {L.items.map((it) =>
        it.ghost ? (
          <g key={`g${it.parent.id}${it.side}`} className="ghost" onClick={() => onGhost && onGhost(it.parent, it.side)}>
            <circle cx={it.x} cy={it.y} r="12" />
          </g>
        ) : (
          <g key={`n${it.node.id}`} className={`n ${(roles && roles.get(it.node)) || ''} ${pick ? 'pick' : ''}`} onClick={() => onNode && onNode(it.node)}>
            <circle cx={it.x} cy={it.y} r="17" />
            <text x={it.x} y={it.y} dy=".35em">{it.node.v}</text>
          </g>
        )
      )}
    </svg>
  )
}
