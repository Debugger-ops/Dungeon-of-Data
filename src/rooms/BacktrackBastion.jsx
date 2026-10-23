import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { qBack, qDone, qInit, qOptions, qPlace, qStuck, safe, subsetOk, subsetPuzzle } from '../lib/backtrack'
import { starsBad } from '../lib/util'

export default function BacktrackBastion() {
  const [round, setRound] = useState(0)
  const again = () => setRound((r) => r + 1)
  return (
    <Room
      title="Backtrack Bastion"
      lede="Backtracking tries a choice, goes deeper, and undoes it the moment it hits a dead end. Place queens that cannot attack each other, or decide which items reach an exact sum."
      modes={[['queens', 'N-Queens'], ['subset', 'Subset sum']]}
    >
      {(mode) => (mode === 'queens' ? <QueensPlay key={`q${round}`} again={again} /> : <SubsetPlay key={`s${round}`} again={again} />)}
    </Room>
  )
}

function QueensPlay({ again }) {
  const N = 5
  const [s, setS] = useState(() => qInit(N))
  const [bad, setBad] = useState(0)
  const [backs, setBacks] = useState(0)
  const [placed, setPlaced] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('back', N, 5, `Fill the board one row at a time. Click a safe square in the current row. If no square is safe, press Backtrack to undo the last queen.`)
  const row = s.cols.length
  const stuck = qStuck(s)

  const place = (c) => {
    if (over || qDone(s) || stuck) return
    if (safe(s.cols, c) && !s.tried[row].includes(c)) {
      const n = qPlace(s, c)
      setS(n)
      const best = Math.max(placed, n.cols.length)
      setPlaced(best)
      laneSet(lane.dist, best, true)
      if (qDone(n)) return finish(true, starsBad(bad), `All ${N} queens placed after ${backs} backtrack${backs === 1 ? '' : 's'}. Backtracking is depth-first search with pruning: abandon a branch the moment it cannot work.`, N + backs, bad)
      say(`Queen placed in row ${row + 1}, column ${c + 1}.`, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, placed, false)
      say(s.tried[row].includes(c) ? 'That square already led to a dead end. Try another.' : 'That square is attacked by a queen in the same column or diagonal.', 'bad')
      if (d <= 0) finish(false, 0, 'A queen attacks its whole column and both diagonals. Only place on squares no earlier queen reaches.', placed, b)
    }
  }
  const back = () => {
    if (over || qDone(s)) return
    if (stuck) {
      setS(qBack(s))
      setBacks(backs + 1)
      say('Dead end. Removed the last queen and marked its square as tried.', 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, placed, false)
      say('There is still a safe square in this row, so do not backtrack yet.', 'bad')
      if (d <= 0) finish(false, 0, 'Backtrack only when the current row has no safe square left.', placed, b)
    }
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="statrow"><span>Row <b>{Math.min(row + 1, N)}/{N}</b></span><span>Backtracks <b data-testid="backs">{backs}</b></span>{stuck && <span><b style={{ color: 'var(--bad)' }}>Dead end</b></span>}</div>
        <div className="qboard" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }} role="group" aria-label="Chess board">
          {Array.from({ length: N * N }, (_, k) => {
            const r = Math.floor(k / N)
            const c = k % N
            const queen = s.cols[r] === c
            const attacked = r === row && !safe(s.cols, c)
            const tried = r === row && s.tried[r].includes(c)
            return (
              <button key={k} className={`qcell ${(r + c) % 2 ? 'dk' : ''} ${queen ? 'q' : ''} ${attacked || tried ? 'x' : ''} ${r === row ? 'cur' : ''}`} disabled={r !== row || over} onClick={() => place(c)}
                aria-label={queen ? `Row ${r + 1} column ${c + 1}, queen` : `Row ${r + 1} column ${c + 1}${r === row ? (attacked ? ', attacked' : tried ? ', tried' : ', safe') : ''}`}>
                {queen ? '♛' : tried ? '×' : ''}
              </button>
            )
          })}
        </div>
        <div className={`msg ${msg.c}`} style={{ marginTop: 10 }}>{msg.t}</div>
        {!over && (
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn primary" onClick={back}>Backtrack</button>
            <HintButton onHint={() => hint(stuck ? 'Every square in this row is attacked or tried. Backtrack.' : `Safe squares in this row: ${qOptions(s).map((c) => c + 1).join(', ')}.`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}

function SubsetPlay({ again }) {
  const pz = useMemo(() => subsetPuzzle(6), [])
  const [i, setI] = useState(0)
  const [need, setNeed] = useState(pz.target)
  const [taken, setTaken] = useState([])
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('back', pz.items.length, 4, `Reach exactly ${pz.target}. For each item choose Take or Skip. Do not take an item if the target can no longer be reached.`)
  const act = (take) => {
    if (over) return
    if (subsetOk(pz.items, i, need, take)) {
      const n = need - (take ? pz.items[i] : 0)
      const nt = take ? [...taken, pz.items[i]] : taken
      setNeed(n)
      setTaken(nt)
      setI(i + 1)
      laneSet(lane.dist, i + 1, true)
      if (i + 1 >= pz.items.length) return finish(true, starsBad(bad), `${nt.join(' + ')} = ${pz.target}. Each choice branches into take or skip; backtracking prunes any branch whose remaining total goes negative or can never reach the target.`, pz.items.length, bad)
      say(`${take ? 'Took' : 'Skipped'} ${pz.items[i]}. Still need ${n}.`, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, i, false)
      say(take ? (pz.items[i] > need ? `${pz.items[i]} is bigger than the ${need} still needed: that branch is pruned.` : `Taking ${pz.items[i]} leaves ${need - pz.items[i]}, which the remaining items cannot make.`) : `Skipping ${pz.items[i]} leaves ${need} needed, which the remaining items cannot make. You must take it.`, 'bad')
      if (d <= 0) finish(false, 0, 'Check both branches: after the choice, can the remaining items still add up to what is left?', i, b)
    }
  }
  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <div className="tokens" aria-label={`Items ${pz.items.join(', ')}`}>
          {pz.items.map((v, k) => <span key={k} className={`tok ${k < i ? 'past' : k === i ? 'now' : ''}`}>{v}</span>)}
        </div>
        <div className="statrow" style={{ margin: '10px 0 4px' }}><span>Target <b>{pz.target}</b></span><span>Still need <b data-testid="need">{need}</b></span><span>Taken <b>{taken.join(', ') || 'none'}</b></span></div>
        <div className={`msg ${msg.c}`}>{msg.t}</div>
        {!over && (
          <div className="row" style={{ marginTop: 8 }}>
            <span className="fine" style={{ margin: 0 }}>Item {pz.items[Math.min(i, pz.items.length - 1)]}:</span>
            <button className="btn primary" onClick={() => act(true)}>Take</button>
            <button className="btn" onClick={() => act(false)}>Skip</button>
            <HintButton onHint={() => hint(`You need ${need} from ${pz.items.slice(i).join(', ')}. Try each choice and ask whether the rest can still reach it.`)} />
          </div>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
