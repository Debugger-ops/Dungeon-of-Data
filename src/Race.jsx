import { useMemo, useState } from 'react'
import { useProgress } from './progress'
import { ALGOS, buildFrames } from './lib/algos'
import { shuffle, uniq } from './lib/util'

const KEYS = Object.keys(ALGOS)
const count = (algo, arr) => { const f = buildFrames(algo, arr); return f[f.length - 1].cmp }
function matchup() {
  for (;;) {
    const [a, b] = shuffle(KEYS).slice(0, 2)
    const arr = uniq(10, 1, 60)
    const ca = count(a, arr)
    const cb = count(b, arr)
    if (ca !== cb) return { a, b, arr, ca, cb }
  }
}
const ROUNDS = 5

// Which sort needs fewer comparisons on this exact array? Predict, then see the real counts.
export default function Race() {
  const { go, awardBonus } = useProgress()
  const [ms, setMs] = useState(() => Array.from({ length: ROUNDS }, matchup))
  const [i, setI] = useState(0)
  const [pick, setPick] = useState(null)
  const [score, setScore] = useState(0)
  const [gain, setGain] = useState(null)
  const m = ms[Math.min(i, ROUNDS - 1)]
  const win = m.ca < m.cb ? 'a' : 'b'
  const choose = (k) => { if (!pick) setPick(k) }
  const next = () => {
    const s = score + (pick === win ? 1 : 0)
    setScore(s)
    setPick(null)
    if (i + 1 >= ROUNDS) setGain(awardBonus(s * 4 + (s === ROUNDS ? 10 : 0), {}, 'Sorting Race bonus'))
    setI(i + 1)
  }
  const again = () => { setMs(Array.from({ length: ROUNDS }, matchup)); setI(0); setScore(0); setPick(null); setGain(null) }
  return (
    <>
      <div className="roomhead">
        <div><h2>Sorting Race</h2><p className="lede">Two algorithms get the same array. Bet on which one makes fewer comparisons. 4 XP per correct bet, plus 10 for a perfect race.</p></div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      {i >= ROUNDS ? (
        <div className="card" role="status">
          <h3>{score} / {ROUNDS} correct</h3>
          <p className="gain">+{gain} XP</p>
          <div className="row"><button className="btn primary" onClick={again}>Race again</button><button className="btn" onClick={() => go('map')}>Back to map</button></div>
        </div>
      ) : (
        <div className="card">
          <div className="statrow"><span>Race <b>{i + 1}/{ROUNDS}</b></span><span>Score <b>{score}</b></span></div>
          <div className="tokens" aria-label={`Array ${m.arr.join(' ')}`}>{m.arr.map((v) => <span key={v} className="tok">{v}</span>)}</div>
          <p className="fine">Which makes fewer comparisons on this array?</p>
          <div className="row">
            {['a', 'b'].map((k) => (
              <button key={k} className={`btn optbtn ${pick && (k === win ? 'ok' : pick === k ? 'bad' : '')}`} disabled={!!pick} onClick={() => choose(k)}>{ALGOS[m[k]].n} sort</button>
            ))}
          </div>
          {pick && (
            <>
              <div className={`msg ${pick === win ? 'ok' : 'bad'}`} style={{ marginTop: 10 }} role="status">
                {pick === win ? 'Right. ' : 'Not this time. '}{ALGOS[m.a].n}: {m.ca} comparisons. {ALGOS[m.b].n}: {m.cb} comparisons.
              </div>
              <button className="btn primary" style={{ marginTop: 8 }} onClick={next}>{i + 1 >= ROUNDS ? 'Finish' : 'Next race'}</button>
            </>
          )}
        </div>
      )}
    </>
  )
}
