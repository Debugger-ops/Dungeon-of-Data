import { useEffect, useMemo, useState } from 'react'
import { useProgress } from './progress'
import { ALGOS, buildFrames } from './lib/algos'
import Bars from './components/Bars'
import { uniq } from './lib/util'

const parse = (txt) => {
  const nums = txt.split(/[\s,]+/).map(Number).filter((x) => Number.isFinite(x) && x >= 0 && x <= 999)
  return [...new Set(nums)].slice(0, 16)
}

// Sandbox: type your own numbers, pick an algorithm and scrub through every step.
export default function Visualizer() {
  const { go } = useProgress()
  const [algo, setAlgo] = useState('quick')
  const [text, setText] = useState(() => uniq(9, 1, 60).join(', '))
  const [i, setI] = useState(0)
  const [play, setPlay] = useState(false)
  const [speed, setSpeed] = useState(500)
  const input = useMemo(() => parse(text), [text])
  const frames = useMemo(() => (input.length >= 2 ? buildFrames(algo, input) : null), [algo, input])
  useEffect(() => { setI(0); setPlay(false) }, [algo, text])
  useEffect(() => {
    if (!play || !frames) return
    const t = setInterval(() => setI((x) => { if (x >= frames.length - 1) { setPlay(false); return x } return x + 1 }), speed)
    return () => clearInterval(t)
  }, [play, speed, frames])
  const A = ALGOS[algo]
  const f = frames && frames[Math.min(i, frames.length - 1)]
  const roles = {}
  if (f) {
    f.done.forEach((k) => (roles[k] = 'done'))
    f.hi.forEach((k) => (roles[k] = f.kind === 'swap' ? 'swap' : f.kind === 'pivot' ? 'pivot' : 'cmp'))
  }
  return (
    <>
      <div className="roomhead">
        <div><h2>Visualizer</h2><p className="lede">Type up to 16 distinct numbers (0 to 999), choose a sorting algorithm and step through it. Nothing here costs lives or earns XP, so experiment freely.</p></div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      <div className="card">
        <div className="chips" role="radiogroup" aria-label="Algorithm">
          {Object.entries(ALGOS).map(([k, a]) => <button key={k} role="radio" aria-checked={algo === k} className={`chip ${algo === k ? 'on' : ''}`} onClick={() => setAlgo(k)}>{a.n}</button>)}
        </div>
        <label className="field" style={{ marginTop: 10 }}>Numbers
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} aria-label="Numbers to sort" />
        </label>
        <div className="row">
          <button className="btn" onClick={() => setText(uniq(9, 1, 60).join(', '))}>Randomize</button>
          <button className="btn" onClick={() => setText(Array.from({ length: 9 }, (_, k) => 9 - k).join(', '))}>Reversed</button>
          <button className="btn" onClick={() => setText(Array.from({ length: 9 }, (_, k) => k + 1).join(', '))}>Already sorted</button>
        </div>
        {!frames && <div className="msg bad" style={{ marginTop: 8 }}>Enter at least two different numbers.</div>}
      </div>
      {frames && (
        <div className="card">
          <Bars vals={input.length ? f.a.slice().sort((x, y) => x - y) : []} arr={f.a} roles={roles} />
          <div className="statrow" style={{ margin: '10px 0' }}>
            <span>Step <b data-testid="viz-step">{i}/{frames.length - 1}</b></span><span>Comparisons <b>{f.cmp}</b></span><span>Swaps <b>{f.swp}</b></span>
            <span>Best / avg / worst <b>{A.cx[0]} / {A.cx[1]} / {A.cx[2]}</b></span><span>Stable <b>{A.cx[4]}</b></span>
          </div>
          <div className="msg">{f.msg}</div>
          <div className="code" style={{ margin: '8px 0' }}>{A.code.map((l, k) => <div key={k} className={k === f.line ? 'on' : ''}>{l}</div>)}</div>
          <div className="row">
            <button className="btn" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>← Back</button>
            <button className="btn primary" onClick={() => { if (i >= frames.length - 1) setI(0); setPlay(!play) }}>{play ? 'Pause' : 'Play'}</button>
            <button className="btn" onClick={() => setI(Math.min(frames.length - 1, i + 1))} disabled={i >= frames.length - 1}>Step →</button>
            <label className="fine" style={{ margin: 0 }}>Speed
              <input type="range" min="100" max="1000" step="100" value={1100 - speed} onChange={(e) => setSpeed(1100 - Number(e.target.value))} aria-label="Speed" />
            </label>
          </div>
          <input type="range" min="0" max={frames.length - 1} value={Math.min(i, frames.length - 1)} onChange={(e) => { setPlay(false); setI(Number(e.target.value)) }} aria-label="Scrub" style={{ width: '100%', marginTop: 8 }} />
        </div>
      )}
    </>
  )
}
