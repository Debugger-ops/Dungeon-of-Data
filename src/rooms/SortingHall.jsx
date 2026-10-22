import { useEffect, useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import Bars from '../components/Bars'
import { HBars, Legend } from '../components/Charts'
import { useRound } from '../hooks'
import { ALGOS, buildFrames, inv, minSwaps } from '../lib/algos'
import { shuffle, uniq } from '../lib/util'

export default function SortingHall() {
  const [round, setRound] = useState(0)
  return (
    <Room
      title="Sorting Hall"
      lede="A barricade of mismatched bars blocks the hall. Defend with swaps, or study how each sorting spell works step by step."
      modes={[['play', 'Defend'], ['watch', 'Study spells']]}
    >
      {(mode) => (mode === 'play' ? <SortPlay key={round} again={() => setRound((r) => r + 1)} /> : <SortWatch />)}
    </Room>
  )
}

function SortPlay({ again }) {
  const init = useMemo(() => {
    let a
    do {
      a = shuffle(uniq(8, 12, 99))
    } while (inv(a) < 8)
    return { a, sorted: [...a].sort((x, y) => x - y), par: minSwaps(a) }
  }, [])
  const [arr, setArr] = useState(init.a)
  const [sel, setSel] = useState(null)
  const [swaps, setSwaps] = useState(0)
  const [good, setGood] = useState(0)
  const [bad, setBad] = useState(0)
  const [hints, setHints] = useState(0)
  const [hi, setHi] = useState(null)
  const { lane, laneSet, msg, say, end, over, finish } = useRound('sort', 5, 5, 'Tap two bars to swap them. Goal: shortest on the left, tallest on the right, in as few swaps as you can.')
  const { sorted, par } = init

  const roles = {}
  arr.forEach((v, i) => {
    if (v === sorted[i]) roles[i] = 'done'
  })
  if (hi) {
    roles[hi[0]] = 'hint'
    roles[hi[1]] = 'hint'
  }
  if (sel !== null) roles[sel] = 'sel'

  const pick = (idx) => {
    if (over) return
    setHi(null)
    if (sel === null) return setSel(idx)
    if (sel === idx) return setSel(null)
    const i = Math.min(sel, idx)
    const j = Math.max(sel, idx)
    const isGood = arr[i] > arr[j] // swapping an inverted pair always removes inversions
    const next = [...arr]
    const a = next[i]
    const c = next[j]
    next[i] = c
    next[j] = a
    setArr(next)
    setSel(null)
    const sw = swaps + 1
    setSwaps(sw)
    let g = good
    let b = bad
    let dist = lane.dist
    let k = lane.killed
    if (isGood) {
      g++
      k = Math.min(k + 1, 5)
      laneSet(dist, k, true)
      say(`Good swap: ${a} stood left of ${c} but is taller, so that pair was an inversion. A goblin falls.`, 'ok')
    } else {
      b++
      dist--
      laneSet(dist, k, false)
      say(`Bad swap: ${c} was already left of ${a} and bigger, so you created an inversion. Goblins advance.`, 'bad')
    }
    setGood(g)
    setBad(b)
    if (next.every((v, x) => v === sorted[x])) {
      laneSet(dist, 5, true)
      const st = hints > 0 ? (sw <= par + 1 ? 2 : 1) : sw <= par ? 3 : sw <= par + 2 ? 2 : 1
      finish(true, st, `Sorted in ${sw} swaps. The minimum possible for this barricade is ${par} (n minus the number of cycles in the permutation).`, g, b)
    } else if (dist <= 0) {
      finish(false, 0, 'Too many swaps that created new inversions. A useful swap always puts a taller bar after a shorter one.', g, b)
    }
  }

  const hint = () => {
    if (over) return
    let i = 0
    while (i < arr.length && arr[i] === sorted[i]) i++
    if (i >= arr.length) return
    setHints(hints + 1)
    setHi([i, arr.indexOf(sorted[i])])
    setSel(null)
    say(`Hint: ${sorted[i]} belongs at position ${i + 1}.`)
  }

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="statrow">
          <span>Swaps <b>{swaps}</b> (par {par})</span>
          <span>Hints <b>{hints}</b></span>
        </div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        <div style={{ marginTop: 12 }}>
          <Bars vals={init.a} arr={arr} roles={roles} onPick={pick} />
        </div>
        <div className="row">
          <button className="btn" onClick={hint}>Hint (caps stars at 2)</button>
          <button className="btn ghost" onClick={again}>New barricade</button>
        </div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

function SortWatch() {
  const [algo, setAlgo] = useState('bubble')
  const [size, setSize] = useState(10)
  const [arr, setArr] = useState(() => shuffle(uniq(10, 10, 99)))
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(5)
  const [race, setRace] = useState(null)

  const frames = useMemo(() => buildFrames(algo, arr), [algo, arr])
  const last = frames.length - 1
  const f = frames[Math.min(idx, last)]
  const delay = Math.round(1100 / ((speed * speed) / 2 + 1))

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setIdx((i) => Math.min(i + 1, last)), delay)
    return () => clearInterval(id)
  }, [playing, delay, last])
  useEffect(() => {
    if (playing && idx >= last) setPlaying(false)
  }, [idx, playing, last])

  const reset = (nextArr, nextAlgo) => {
    setPlaying(false)
    setIdx(0)
    setRace(null)
    if (nextArr) setArr(nextArr)
    if (nextAlgo) setAlgo(nextAlgo)
  }
  const roles = {}
  f.done.forEach((i) => (roles[i] = 'done'))
  f.hi.forEach((i) => (roles[i] = f.kind === 'swap' ? 'swap' : f.kind === 'pivot' ? 'pivot' : 'cmp'))

  const runRace = () =>
    setRace(
      Object.keys(ALGOS).map((k) => {
        const fr = buildFrames(k, arr)
        const l = fr[fr.length - 1]
        return { name: ALGOS[k].n, v: [l.cmp, l.swp] }
      })
    )
  const A = ALGOS[algo]

  return (
    <>
      <div className="card">
        <div className="row">
          {Object.keys(ALGOS).map((k) => (
            <button key={k} className={`opt ${k === algo ? 'on' : ''}`} onClick={() => reset(null, k)}>{ALGOS[k].n} sort</button>
          ))}
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--mut)' }}>Size</span>
          {[8, 12, 16].map((n) => (
            <button key={n} className={`opt ${n === size ? 'on' : ''}`} onClick={() => { setSize(n); reset(shuffle(uniq(n, 10, 99))) }}>{n}</button>
          ))}
          <button className="btn ghost" onClick={() => reset(shuffle(uniq(size, 10, 99)))}>New array</button>
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <div className="statrow">
            <span>Step <b>{idx}</b>/<b>{last}</b></span>
            <span>Comparisons <b>{f.cmp}</b></span>
            <span>Swaps/writes <b>{f.swp}</b></span>
          </div>
          <Bars vals={arr} arr={f.a} roles={roles} />
          <div className="msg">{f.msg}</div>
          <div className="ctrl" style={{ marginTop: 8 }}>
            <button className="btn" aria-label="Back" onClick={() => setIdx((i) => Math.max(0, i - 1))}>◀</button>
            <button className="btn primary" onClick={() => { if (idx >= last) setIdx(0); setPlaying(!playing) }}>{playing ? '⏸ Pause' : idx >= last ? '↻ Replay' : '▶ Play'}</button>
            <button className="btn" aria-label="Step" onClick={() => setIdx((i) => Math.min(last, i + 1))}>▶|</button>
            <label htmlFor="spd">Speed</label>
            <input id="spd" type="range" min="1" max="10" value={speed} onChange={(e) => setSpeed(+e.target.value)} style={{ maxWidth: 140 }} />
          </div>
          <input type="range" min="0" max={last} value={idx} aria-label="Scrub steps" style={{ marginTop: 8 }} onChange={(e) => { setPlaying(false); setIdx(+e.target.value) }} />
        </div>
        <div className="card flat">
          <h3>{A.n} sort</h3>
          <div className="code" style={{ margin: '8px 0' }}>
            {A.code.map((l, i) => <div key={i} className={i === f.line ? 'on' : ''}>{l}</div>)}
          </div>
          <div className="scroll" tabIndex={0}>
            <table>
              <thead><tr><th>Best</th><th>Avg</th><th>Worst</th><th>Space</th><th>Stable</th></tr></thead>
              <tbody><tr>{A.cx.map((c, i) => <td key={i} className="mono">{c}</td>)}</tr></tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Spell race on this array</h3>
          <button className="btn" onClick={runRace}>Run all five</button>
        </div>
        <p className="lede" style={{ margin: '6px 0 10px' }}>Same input for every algorithm. Fewer comparisons means a cheaper spell. Try 16 elements to see the gap open up.</p>
        {race && (
          <>
            <HBars groups={race} series={[['Comparisons', 'var(--torch)'], ['Swaps / writes', 'var(--arc)']]} />
            <Legend items={[['Comparisons', 'var(--torch)'], ['Swaps / writes', 'var(--arc)']]} />
          </>
        )}
      </div>
    </>
  )
}
