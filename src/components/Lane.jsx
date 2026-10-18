import { useEffect, useState } from 'react'

export default function Lane({ total, max, dist, killed, hit }) {
  const [fire, setFire] = useState(false)
  useEffect(() => {
    if (!hit) return
    setFire(true)
    const t = setTimeout(() => setFire(false), 220)
    return () => clearTimeout(t)
  }, [hit])

  const step = 560 / max
  return (
    <>
      <svg className={`lane ${dist <= 1 ? 'danger' : ''}`} viewBox="0 0 740 90" role="img" aria-label="Goblin lane. The keep is on the left.">
        <line className="ground" x1="62" x2="730" y1="66" y2="66" />
        {Array.from({ length: max + 1 }, (_, i) => (
          <line key={i} className="tick" x1={70 + i * step} x2={70 + i * step} y1="58" y2="74" />
        ))}
        <g className={`keep ${fire ? 'fire' : ''}`}>
          <rect className="kb" x="8" y="30" width="46" height="42" />
          <rect className="kb" x="8" y="20" width="10" height="10" />
          <rect className="kb" x="26" y="20" width="10" height="10" />
          <rect className="kb" x="44" y="20" width="10" height="10" />
          <circle className="torch" cx="31" cy="48" r="6" />
        </g>
        {Array.from({ length: total }, (_, i) => {
          const r = Math.max(0, i - killed)
          const x = 70 + Math.max(dist, 0) * step + r * 17
          return (
            <g key={i} className="gob" style={{ transform: `translate(${x}px,52px)`, opacity: i < killed ? 0 : 1 }}>
              <path className="ear" d="M-10 -6 L-19 -17 L-5 -11Z M10 -6 L19 -17 L5 -11Z" />
              <circle className="gbody" r="11" />
              <circle className="eye" cx="-4" cy="-2" r="2" />
              <circle className="eye" cx="4" cy="-2" r="2" />
              <path className="mouth" d="M-5 5 Q0 8 5 5" />
            </g>
          )
        })}
      </svg>
      <div className="lane-meta">
        <span>
          Goblins <b>{Math.max(dist, 0)}</b> tiles from the keep
        </span>
        <span>
          Slain <b>{Math.min(killed, total)}/{total}</b>
        </span>
      </div>
    </>
  )
}
