import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import { useRound } from '../hooks'
import { starsBad, uniq } from '../lib/util'

export default function HashForge() {
  const [round, setRound] = useState(0)
  const again = () => setRound((r) => r + 1)
  return (
    <Room
      title="Hash Forge"
      lede="Goblin keys arrive at the forge and every one needs a bucket. Compute the hash, then handle the collisions with chains or by probing for a free slot."
      modes={[['chain', 'Chaining'], ['probe', 'Linear probing']]}
    >
      {(mode) => (mode === 'chain' ? <Chain key={`c${round}`} again={again} /> : <Probe key={`p${round}`} again={again} />)}
    </Room>
  )
}

function Chain({ again }) {
  const M = 7
  const keys = useMemo(() => {
    let k
    do {
      k = uniq(8, 10, 99)
    } while (new Set(k.map((x) => x % M)).size > 5) // force several collisions
    return k
  }, [])
  const [i, setI] = useState(0)
  const [table, setTable] = useState(() => Array.from({ length: M }, () => []))
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, end, over, finish } = useRound('hash', keys.length, 4, `h(k) = k mod ${M}. Tap the bucket where ${keys[0]} belongs.`)
  const lesson = 'With chaining a bucket holds a list, so collisions just make that list longer. Average chain length is the load factor n / m, so lookups cost O(1 + n/m). If every key collides the table decays to one O(n) list.'

  const pick = (b) => {
    if (over) return
    const k = keys[i]
    const home = k % M
    if (b === home) {
      const had = table[b].length
      const t = table.map((c, x) => (x === b ? [...c, k] : c))
      setTable(t)
      setI(i + 1)
      laneSet(lane.dist, i + 1, true)
      if (i + 1 >= keys.length) return finish(true, starsBad(bad), lesson, keys.length, bad)
      say(`${k} mod ${M} = ${home}. ${had ? `Collision: it joins the chain after ${table[b].join(', ')}.` : 'The bucket was empty.'} Next key: ${keys[i + 1]}.`, 'ok')
    } else {
      const bb = bad + 1
      const d = lane.dist - 1
      setBad(bb)
      laneSet(d, i, false)
      say(`${k} mod ${M} = ${home}, not ${b}. Divide by ${M} and keep the remainder.`, 'bad')
      if (d <= 0) finish(false, 0, 'The hash of a key is its remainder after dividing by the number of buckets. Same key, same bucket, every time.', i, bb)
    }
  }

  const placed = table.reduce((a, c) => a + c.length, 0)
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="big">{i < keys.length ? `Place ${keys[i]}` : 'All placed'}</div>
          <div className="statrow" style={{ margin: 0 }}>
            <span>h(k) = k mod <b>{M}</b></span>
            <span>Load factor <b>{(placed / M).toFixed(2)}</b></span>
            <span>Longest chain <b>{Math.max(...table.map((c) => c.length))}</b></span>
          </div>
        </div>
        <div className={`msg ${msg.c}`} style={{ margin: '8px 0' }}>{msg.t}</div>
        <div className="buckets">
          {table.map((c, b) => (
            <button key={b} className={`bucket ${over ? '' : 'can'}`} onClick={() => pick(b)} aria-label={`Bucket ${b}`}>
              <span className="bx">{b}</span>
              <span className="chain">
                {c.map((v, x) => <span key={v} className="link">{v}{x < c.length - 1 ? ' →' : ''}</span>)}
                {!c.length && <span className="tag">empty</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

function Probe({ again }) {
  const M = 10
  const keys = useMemo(() => {
    let k
    let hits
    do {
      k = uniq(7, 10, 99)
      const t = Array(M).fill(null)
      hits = 0
      k.forEach((v) => {
        let s = v % M
        if (t[s] !== null) hits++
        while (t[s] !== null) s = (s + 1) % M
        t[s] = v
      })
    } while (hits < 3) // need real collisions to practise on
    return k
  }, [])
  const [i, setI] = useState(0)
  const [table, setTable] = useState(() => Array(M).fill(null))
  const [probes, setProbes] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, end, over, finish } = useRound('hash', keys.length, 4, `h(k) = k mod ${M}. Tap the slot where ${keys[0]} ends up after probing.`)
  const lesson = 'Linear probing stores everything in one array and walks to the next free slot. Runs of full slots grow and swallow more keys (primary clustering), so keep the load factor below about 0.7 and resize. A delete needs a tombstone so later probes do not stop early.'

  const slotFor = (k, t) => {
    let s = k % M
    let n = 0
    while (t[s] !== null) {
      s = (s + 1) % M
      n++
    }
    return [s, n]
  }

  const pick = (s) => {
    if (over) return
    const k = keys[i]
    const home = k % M
    const [want, extra] = slotFor(k, table)
    if (s === want) {
      const t = table.map((v, x) => (x === s ? k : v))
      setTable(t)
      setI(i + 1)
      setProbes(probes + extra)
      laneSet(lane.dist, i + 1, true)
      if (i + 1 >= keys.length) return finish(true, starsBad(bad), lesson, keys.length, bad)
      say(`${k} mod ${M} = ${home}. ${extra ? `Slot ${home} was taken, so it probed ${extra} extra slot${extra > 1 ? 's' : ''} to reach ${s}.` : 'The home slot was free.'} Next key: ${keys[i + 1]}.`, 'ok')
    } else {
      const bb = bad + 1
      const d = lane.dist - 1
      setBad(bb)
      laneSet(d, i, false)
      say(
        table[s] !== null
          ? `Slot ${s} already holds ${table[s]}. Start at ${k} mod ${M} = ${home} and move right until a slot is free.`
          : `${k} starts at slot ${home} and takes the first free slot to the right (wrapping past ${M - 1} back to 0), which is not slot ${s}.`,
        'bad'
      )
      if (d <= 0) finish(false, 0, 'Linear probing: try h(k), then h(k)+1, h(k)+2, and so on (mod the table size) until a slot is empty.', i, bb)
    }
  }

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="big">{i < keys.length ? `Place ${keys[i]}` : 'All placed'}</div>
          <div className="statrow" style={{ margin: 0 }}>
            <span>h(k) = k mod <b>{M}</b></span>
            <span>Load factor <b>{(i / M).toFixed(2)}</b></span>
            <span>Extra probes <b>{probes}</b></span>
          </div>
        </div>
        <div className={`msg ${msg.c}`} style={{ margin: '8px 0' }}>{msg.t}</div>
        <div className="slots">
          {table.map((v, s) => (
            <button key={s} className={`slot ${v !== null ? 'full' : ''} ${over ? '' : 'can'}`} onClick={() => pick(s)} aria-label={`Slot ${s}`}>
              <span className="ix">{s}</span>
              {v !== null ? v : ''}
            </button>
          ))}
        </div>
        <div className="tag" style={{ marginTop: 6 }}>Upcoming keys: {keys.slice(i + 1).join(', ') || 'none'}</div>
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
