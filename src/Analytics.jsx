import { useMemo, useState } from 'react'
import { liveStreak, useProgress } from './progress'
import { ROOMS } from './lib/rooms'
import { dayKey } from './lib/util'
import { SIZES, SORT_NAMES, bstHeights, sortCounts } from './lib/bench'
import { AreaLine, Curves, Empty, Heatmap, LogLog, Radar, RollingLine, StackBars } from './components/Viz'

const SHORT = { sort: 'Sorting', bsearch: 'Vault', keep: 'Keep', crypt: 'Crypt', maze: 'Labyrinth', hash: 'Forge' }
const SORT_COLORS = { bubble: 'var(--bad)', selection: 'var(--vio)', insertion: 'var(--torch)', merge: 'var(--ok)', quick: 'var(--arc)' }
const WEEKS = 16

// Synthetic data so the charts can be previewed before you have played much. Never saved.
function demoState() {
  let a = 20261019
  const r = () => (a = (Math.imul(a, 1664525) + 1013904223) >>> 0) / 4294967296
  const rooms = {}
  ROOMS.forEach((ro) => {
    const tries = 5 + Math.floor(r() * 14)
    const ok = 30 + Math.floor(r() * 90)
    rooms[ro.id] = { tries, wins: Math.round(tries * (0.45 + r() * 0.5)), ok, bad: Math.floor(ok * (0.08 + r() * 0.5)), stars: 1 + Math.floor(r() * 3) }
  })
  const hist = Array.from({ length: 30 }, (_, i) => {
    const acc = Math.min(100, Math.round(38 + i * 1.5 + r() * 24))
    return { id: 'x', win: acc > 52 + r() * 22, stars: 1, acc }
  })
  const activity = {}
  let xp = 0
  for (let d = 89; d >= 0; d--) {
    if (r() < 0.55) {
      const n = 1 + Math.floor(r() * 5)
      const g = n * (20 + Math.floor(r() * 25))
      const dt = new Date()
      dt.setDate(dt.getDate() - d)
      activity[dayKey(dt)] = { n, xp: g }
      xp += g
    }
  }
  return { xp, rooms, hist, activity, streak: { count: 4, best: 9, last: dayKey() } }
}

const dayAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export default function Analytics() {
  const { S, go } = useProgress()
  const [tab, setTab] = useState('me')
  const [demo, setDemo] = useState(false)
  const D = useMemo(() => (demo ? demoState() : S), [demo, S])
  const tries = ROOMS.reduce((a, r) => a + D.rooms[r.id].tries, 0)
  const empty = tries === 0 && !Object.keys(D.activity || {}).length

  return (
    <>
      <div className="roomhead">
        <div>
          <h2>Analytics</h2>
          <p className="lede">Charts of how you play, and measured experiments that show how the algorithms really scale.</p>
        </div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="chips">
          <button className={`chip ${tab === 'me' ? 'on' : ''}`} onClick={() => setTab('me')}>My progress</button>
          <button className={`chip ${tab === 'lab' ? 'on' : ''}`} onClick={() => setTab('lab')}>Algorithm lab</button>
        </div>
        {tab === 'me' && <button className={`btn ${demo ? 'primary' : ''}`} onClick={() => setDemo(!demo)}>{demo ? 'Showing sample data (not saved)' : 'Preview with sample data'}</button>}
      </div>
      {tab === 'me' ? <Progress D={D} empty={empty} demo={demo} /> : <Lab />}
    </>
  )
}

function Progress({ D, empty, demo }) {
  const wins = ROOMS.reduce((a, r) => a + D.rooms[r.id].wins, 0)
  const tries = ROOMS.reduce((a, r) => a + D.rooms[r.id].tries, 0)
  const ok = ROOMS.reduce((a, r) => a + D.rooms[r.id].ok, 0)
  const bad = ROOMS.reduce((a, r) => a + D.rooms[r.id].bad, 0)
  const act = D.activity || {}
  const active = Object.keys(act).length
  const best = demo ? D.streak.best : Math.max(D.streak.best, liveStreak(D))

  const axes = ROOMS.map((r) => {
    const x = D.rooms[r.id]
    const t = x.ok + x.bad
    const acc = t ? x.ok / t : 0
    return { label: SHORT[r.id], a: x.tries ? Math.round(100 * (0.6 * acc + 0.4 * (x.stars / 3))) : 0, b: x.tries ? Math.round((100 * x.wins) / x.tries) : 0 }
  })

  // cumulative XP over the last 30 days; XP earned before tracking began is the baseline
  const xpPts = useMemo(() => {
    const keys = Object.keys(act).sort()
    const tracked = keys.reduce((s, k) => s + act[k].xp, 0)
    const base = Math.max(0, D.xp - tracked)
    return Array.from({ length: 30 }, (_, i) => {
      const d = dayAgo(29 - i)
      const key = dayKey(d)
      return { label: `${d.getMonth() + 1}/${d.getDate()}`, v: base + keys.filter((k) => k <= key).reduce((s, k) => s + act[k].xp, 0) }
    })
  }, [act, D.xp])
  const hasXp = Object.keys(act).length > 0

  const cells = useMemo(() => {
    const today = new Date()
    const start = dayAgo(today.getDay() + (WEEKS - 1) * 7)
    return Array.from({ length: WEEKS * 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const day = dayKey(d)
      return { day, n: (act[day] && act[day].n) || 0, future: d > today }
    })
  }, [act])

  const hist = (D.hist || []).map((h) => ({ y: h.acc, win: h.win }))

  return (
    <>
      {empty && <div className="card note">No rounds played yet, so most charts below are empty. Play a few rounds or quizzes, or use the preview button to see what these charts will look like.</div>}
      <div className="kpis">
        <div className="kpi"><small>Total XP</small><b>{D.xp.toLocaleString()}</b></div>
        <div className="kpi"><small>Win rate</small><b>{tries ? `${Math.round((100 * wins) / tries)}%` : '-'}</b></div>
        <div className="kpi"><small>Move accuracy</small><b>{ok + bad ? `${Math.round((100 * ok) / (ok + bad))}%` : '-'}</b></div>
        <div className="kpi"><small>Active days</small><b>{active}</b></div>
        <div className="kpi"><small>Best streak</small><b>{best}</b></div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Mastery by room</h3>
          <p className="lede" style={{ margin: '4px 0 6px' }}>Mastery blends move accuracy (60%) with best stars (40%). Win rate is wins over attempts.</p>
          {tries ? <Radar axes={axes} aName="mastery" bName="win rate" /> : <Empty>Win or lose a room to see your shape here.</Empty>}
          <div className="legend"><span><i style={{ background: 'var(--torch)' }} />Mastery</span><span><i style={{ background: 'var(--arc)' }} />Win rate</span></div>
        </div>
        <div className="card">
          <h3>Wins and losses by room</h3>
          <p className="lede" style={{ margin: '4px 0 8px' }}>Where the keep holds, and where it falls.</p>
          <StackBars rows={ROOMS.map((r) => ({ name: SHORT[r.id], a: D.rooms[r.id].wins, b: D.rooms[r.id].tries - D.rooms[r.id].wins }))} aName="wins" bName="losses" />
        </div>
      </div>
      <div className="card">
        <h3>XP over the last 30 days</h3>
        <p className="lede" style={{ margin: '4px 0 6px' }}>Cumulative XP. Steeper sections are days you played more or cleared the daily challenge.</p>
        {hasXp ? <AreaLine pts={xpPts} unit=" XP" id="xpg" /> : <Empty>XP history starts building from your next round.</Empty>}
      </div>
      <div className="card">
        <h3>Activity, last {WEEKS} weeks</h3>
        <p className="lede" style={{ margin: '4px 0 8px' }}>Rounds and quizzes finished per day.</p>
        <div className="scroll"><Heatmap cells={cells} weeks={WEEKS} /></div>
      </div>
      <div className="card">
        <h3>Accuracy trend</h3>
        <p className="lede" style={{ margin: '4px 0 6px' }}>Is your accuracy rising? The line smooths the noise of single attempts.</p>
        {hist.length >= 2 ? <RollingLine pts={hist} /> : <Empty>Needs at least two finished rounds.</Empty>}
      </div>
    </>
  )
}

const KIND_NOTE = {
  random: 'Random input: merge and quick sort grow like n log n, the three simple sorts grow like n².',
  sorted: 'Already sorted: insertion and bubble (with early exit) only scan once, so they are linear. Quick sort with a last-element pivot hits its worst case and becomes quadratic. Merge sort does not care.',
  reversed: 'Reversed input is the worst case for insertion and bubble sort, and it also triggers quick sort\'s worst case with a last-element pivot. Only merge sort stays at n log n.',
}

function Lab() {
  const all = useMemo(() => ({ random: sortCounts('random'), sorted: sortCounts('sorted'), reversed: sortCounts('reversed') }), [])
  const bst = useMemo(() => bstHeights(), [])
  const [kind, setKind] = useState('random')
  const [alpha, setAlpha] = useState(0.7)

  const sortSeries = [
    ...Object.keys(SORT_NAMES).map((k) => ({ key: k, name: SORT_NAMES[k], color: SORT_COLORS[k], vals: all[kind][k] })),
    { key: 'r1', name: 'n', color: 'var(--mut)', dash: true, vals: SIZES },
    { key: 'r2', name: 'n log n', color: 'var(--mut)', dash: true, vals: SIZES.map((n) => n * Math.log2(n)) },
    { key: 'r3', name: 'n²', color: 'var(--mut)', dash: true, vals: SIZES.map((n) => n * n) },
  ]
  const bstSeries = [
    { key: 'sorted', name: 'Sorted input', color: 'var(--bad)', vals: bst.sorted },
    { key: 'random', name: 'Random input', color: 'var(--arc)', vals: bst.random },
    { key: 'ideal', name: 'Balanced', color: 'var(--ok)', dash: true, vals: bst.ideal },
  ]
  const a = alpha
  const curves = [
    { name: 'Linear probing, miss', color: 'var(--bad)', f: (v) => 0.5 * (1 + 1 / ((1 - v) * (1 - v))) },
    { name: 'Linear probing, hit', color: 'var(--torch)', f: (v) => 0.5 * (1 + 1 / (1 - v)) },
    { name: 'Chaining, miss', color: 'var(--vio)', dash: true, f: (v) => 1 + v },
    { name: 'Chaining, hit', color: 'var(--arc)', dash: true, f: (v) => 1 + v / 2 },
  ]

  return (
    <>
      <div className="card">
        <h3>Sorting: measured comparisons vs input size</h3>
        <p className="lede" style={{ margin: '4px 0 8px' }}>Every algorithm from the Sorting Hall was run on real arrays and its comparisons counted. Dashed lines are the textbook curves. On a log-log chart a straight line's slope is the exponent: slope 1 is linear, slope 2 is quadratic.</p>
        <div className="chips" style={{ marginBottom: 8 }}>
          {[['random', 'Random'], ['sorted', 'Already sorted'], ['reversed', 'Reversed']].map(([k, l]) => (
            <button key={k} className={`opt ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>{l}</button>
          ))}
        </div>
        <LogLog key={kind} xs={SIZES} series={sortSeries} xLabel="n" yLabel="comparisons" />
        <p className="insight">{KIND_NOTE[kind]}{kind === 'random' ? ` At n = 1024, bubble sort makes about ${Math.round(all.random.bubble[7] / all.random.merge[7])}x as many comparisons as merge sort.` : ''}</p>
      </div>
      <div className="card">
        <h3>Binary search tree height: random vs sorted inserts</h3>
        <p className="lede" style={{ margin: '4px 0 8px' }}>Random inserts keep a plain BST fairly shallow (average of 16 shuffles). Insert keys in sorted order and the tree collapses into a chain, so every operation becomes O(n). This is why balanced trees exist.</p>
        <LogLog xs={SIZES} series={bstSeries} xLabel="keys inserted" yLabel="tree height (levels)" />
        <p className="insight">At 1024 keys: balanced needs {bst.ideal[7]} levels, random inserts average {bst.random[7].toFixed(1)}, sorted inserts need 1024.</p>
      </div>
      <div className="card">
        <h3>Hash tables: expected probes vs load factor</h3>
        <p className="lede" style={{ margin: '4px 0 8px' }}>Classic results for uniform hashing. Linear probing degrades sharply as the table fills, while chaining degrades gently. Drag the slider to compare at a load factor (curves are cut off at 12 probes).</p>
        <div className="ctrl" style={{ marginBottom: 8 }}>
          <label htmlFor="alpha">Load factor α = {a.toFixed(2)}</label>
          <input id="alpha" type="range" min="0.05" max="0.95" step="0.01" value={a} onChange={(e) => setAlpha(Number(e.target.value))} />
        </div>
        <Curves curves={curves} marker={a} />
        <div className="legend" style={{ marginTop: 6 }}>{curves.map((c) => <span key={c.name}><i style={{ background: c.color }} />{c.name}</span>)}</div>
        <div className="scroll" style={{ marginTop: 10 }}>
          <table>
            <thead><tr><th>At α = {a.toFixed(2)}</th><th className="num">Expected probes</th></tr></thead>
            <tbody>
              {curves.map((c) => <tr key={c.name}><td>{c.name}</td><td className="num">{c.f(a).toFixed(2)}</td></tr>)}
            </tbody>
          </table>
        </div>
        <p className="insight">Rule of thumb from the curves: resize an open-addressing table before α passes about 0.7, where an unsuccessful probe already averages {(0.5 * (1 + 1 / 0.09)).toFixed(1)} slots.</p>
      </div>
    </>
  )
}
