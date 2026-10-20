import { useEffect, useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { Legend } from '../components/Charts'
import { useRound } from '../hooks'
import { rand, uniq } from '../lib/util'

export default function BinaryVault() {
  const [size, setSize] = useState(16)
  const [round, setRound] = useState(0)
  return (
    <Room title="Binary Vault" lede="The key is hidden in a sorted row of tiles. Halve the search space with each guess before the goblins reach the door." modes={[['v', 'Vault']]}>
      {() => <Vault key={`${size}-${round}`} size={size} setSize={setSize} again={() => setRound((r) => r + 1)} />}
    </Room>
  )
}

function Vault({ size, setSize, again }) {
  const g = useMemo(() => {
    const vals = uniq(size, 1, size * 3).sort((a, b) => a - b)
    const ti = rand(0, size - 1)
    return { vals, ti, target: vals[ti], lg: Math.floor(Math.log2(size)) }
  }, [size])
  const { vals, ti, target, lg } = g
  const maxd = lg + 4
  const [lo, setLo] = useState(0)
  const [hi, setHi] = useState(size - 1)
  const [guesses, setGuesses] = useState(0)
  const [hist, setHist] = useState([size])
  const [marks, setMarks] = useState({})
  const [found, setFound] = useState(null)
  const [shake, setShake] = useState(null)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('bsearch', Math.min(size, 8), maxd, 'Tap a tile to open it. Each guess tells you only "too low" or "too high". Every guess lets the goblins step closer.')

  useEffect(() => {
    if (shake === null) return
    const t = setTimeout(() => setShake(null), 320)
    return () => clearTimeout(t)
  }, [shake])

  const guess = (i) => {
    if (over) return
    const n = guesses + 1
    const dist = lane.dist - 1
    setGuesses(n)
    if (i < lo || i > hi) {
      setShake(i)
      laneSet(dist, 0, false)
      setHist([...hist, hi - lo + 1])
      say(`Tile ${vals[i]} was already ruled out, so that guess taught you nothing.`, 'bad')
    } else if (i === ti) {
      setFound(i)
      setHist([...hist, 1])
      laneSet(dist, Math.min(size, 8), true)
      const st = n <= lg + 1 ? 3 : n <= lg + 2 ? 2 : 1
      return finish(true, st, `Found in ${n} guesses. Binary search needs at most ⌊log₂ ${size}⌋ + 1 = ${lg + 1}. A linear scan could need up to ${size}.`, n, 0)
    } else {
      const low = vals[i] < target
      const nlo = low ? i + 1 : lo
      const nhi = low ? hi : i - 1
      setLo(nlo)
      setHi(nhi)
      setMarks({ ...marks, [i]: low ? '↑' : '↓' })
      setHist([...hist, nhi - nlo + 1])
      laneSet(dist, 0, false)
      say(`${vals[i]} is too ${low ? 'low' : 'high'}: everything ${low ? 'at or below' : 'at or above'} it is out. ${nhi - nlo + 1} spots left.`)
    }
    if (dist <= 0) finish(false, 0, 'The goblins arrived before you found it. Always open the middle of what is left: it removes half the candidates every time.', 0, n)
  }

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="chips">
            {[16, 32, 64].map((n) => (
              <button key={n} className={`opt ${n === size ? 'on' : ''}`} onClick={() => setSize(n)}>{n} tiles</button>
            ))}
          </div>
          <div className="big">Find {target}</div>
        </div>
        <div className="statrow" style={{ marginTop: 10 }}>
          <span>Guesses <b>{guesses}</b></span>
          <span>Possible spots <b>{Math.max(hi - lo + 1, 0)}</b></span>
          <span>Perfect play: at most <b>{lg + 1}</b></span>
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        <div className="row" style={{ marginTop: 6 }}>
          <HintButton disabled={over || found !== null} onHint={() => hint(`${Math.max(hi - lo + 1, 0)} spots are left, from index ${lo} to ${hi}. Open the middle one, index ${Math.floor((lo + hi) / 2)}.`)} />
        </div>
        <div className="tiles" style={{ marginTop: 10 }}>
          {vals.map((v, i) => (
            <button key={v} className={`tile ${i < lo || i > hi ? 'out' : ''} ${found === i ? 'found' : ''} ${shake === i ? 'shake' : ''}`} onClick={() => guess(i)}>
              <span className="ix">{i}</span>
              {v}
              {marks[i] && <small>{marks[i]}</small>}
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Search space after each guess</h3>
        <p className="lede" style={{ margin: '4px 0 8px' }}>Bars are your remaining candidates. The dashed line is perfect halving: n ÷ 2<sup>k</sup>.</p>
        <SpaceChart hist={hist} size={size} lg={lg} />
        <Legend items={[['your candidates', 'var(--arc)'], ['perfect halving', 'var(--torch)'], ['x axis: guesses made']]} />
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

function SpaceChart({ hist, size, lg }) {
  const W = 640, H = 200, L = 40, R = 10, T = 10, B = 26
  const pw = W - L - R
  const ph = H - T - B
  const N = Math.max(hist.length - 1, lg + 1) + 1
  const bw = (pw / N) * 0.6
  const cx = (k) => L + (pw / N) * (k + 0.5)
  const ideal = Array.from({ length: N }, (_, k) => [cx(k), T + ph - (Math.max(size / Math.pow(2, k), 1) / size) * ph])
  return (
    <svg className="svgbox" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Search space chart">
      {[0, 0.5, 1].map((f) => {
        const y = T + ph - f * ph
        return (
          <g key={f}>
            <line x1={L} x2={W - R} y1={y} y2={y} stroke="var(--line)" />
            <text x={L - 6} y={y + 4} fill="var(--mut)" fontSize="11" textAnchor="end">{Math.round(f * size)}</text>
          </g>
        )
      })}
      {Array.from({ length: N }, (_, k) => {
        const v = hist[k]
        const h = v === undefined ? 0 : (v / size) * ph
        return (
          <g key={k}>
            <text x={cx(k)} y={H - 8} fill="var(--mut)" fontSize="11" textAnchor="middle">{k}</text>
            {v !== undefined && (
              <>
                <rect x={cx(k) - bw / 2} y={T + ph - h} width={bw} height={Math.max(h, 1)} rx="2" style={{ fill: 'var(--arc)' }} />
                <text x={cx(k)} y={T + ph - h - 4} fill="var(--fg)" fontSize="11" textAnchor="middle">{v}</text>
              </>
            )}
          </g>
        )
      })}
      <polyline points={ideal.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--torch)" strokeWidth="2" strokeDasharray="5 4" />
      {ideal.map((p, k) => <circle key={k} cx={p[0]} cy={p[1]} r="3" style={{ fill: 'var(--torch)' }} />)}
    </svg>
  )
}
