import { useMemo, useState } from 'react'
import Room from '../components/Room'
import Lane from '../components/Lane'
import Result from '../components/Result'
import HintButton from '../components/HintButton'
import { useRound } from '../hooks'
import { coinChange, knapsack, lcs, options } from '../lib/dp'
import { starsBad } from '../lib/util'

const BUILD = { coin: coinChange, lcs, knap: knapsack }

export default function DPDungeon() {
  const [round, setRound] = useState(0)
  return (
    <Room
      title="DP Dungeon"
      lede="Big problems hide small ones. Fill the table one cell at a time, reusing the answers you already have, and the goblins never get past the recurrence."
      modes={[['coin', 'Coin change'], ['lcs', 'Common subsequence'], ['knap', 'Knapsack']]}
    >
      {(mode) => <DPPlay key={`${mode}${round}`} kind={mode} again={() => setRound((r) => r + 1)} />}
    </Room>
  )
}

function DPPlay({ kind, again }) {
  const puz = useMemo(() => {
    const p = BUILD[kind]()
    return { ...p, opts: p.cells.map((c) => options(c.value)) }
  }, [kind])
  const [filled, setFilled] = useState(puz.init)
  const [i, setI] = useState(0)
  const [bad, setBad] = useState(0)
  const { lane, laneSet, msg, say, hint, end, over, finish } = useRound('dp', puz.cells.length, 4, 'Pick the value of the highlighted cell. Its inputs are outlined.')
  const cell = puz.cells[Math.min(i, puz.cells.length - 1)]
  const done = i >= puz.cells.length
  const depSet = new Set(done ? [] : cell.deps.map(([r, c]) => `${r},${c}`))

  const choose = (v) => {
    if (over || done) return
    if (v === cell.value) {
      setFilled({ ...filled, [`${cell.r},${cell.c}`]: v })
      const n = i + 1
      setI(n)
      laneSet(lane.dist, n, true)
      if (n >= puz.cells.length) return finish(true, starsBad(bad), `${puz.lesson}`, n, bad)
      say(`${cell.why}.`, 'ok')
    } else {
      const b = bad + 1
      const d = lane.dist - 1
      setBad(b)
      laneSet(d, i, false)
      say(`Not ${v}. Look at the outlined cells and apply: ${puz.formula}`, 'bad')
      if (d <= 0) finish(false, 0, `The recurrence is: ${puz.formula}. Work from the cells it points at.`, i, b)
    }
  }

  return (
    <>
      <div className="card"><Lane {...lane} /></div>
      <div className="card">
        <h3 style={{ fontSize: 16 }}>{puz.title}</h3>
        <div className="statrow" style={{ margin: '6px 0 10px' }}>
          <span className="mono">{puz.formula}</span>
        </div>
        <div className="scroll" tabIndex={0}>
          <table className="dpgrid" aria-label="Dynamic programming table">
            <thead>
              <tr>
                <th>{puz.colHead}</th>
                {puz.colLabels.map((l, c) => <th key={c} className="num">{l}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: puz.rows }, (_, r) => (
                <tr key={r}>
                  <th>{puz.rowLabels[r]}</th>
                  {Array.from({ length: puz.cols }, (_, c) => {
                    const k = `${r},${c}`
                    const v = filled[k]
                    const cur = !done && !over && cell.r === r && cell.c === c
                    return (
                      <td key={c} className={`num ${cur ? 'cur' : ''} ${depSet.has(k) && !over ? 'dep' : ''} ${v === undefined ? '' : 'has'}`}>
                        {v !== undefined ? v : cur ? '?' : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`msg ${msg.c}`} style={{ marginTop: 10 }}>{msg.t}</div>
        {!done && !over && (
          <>
            <div className="statrow" style={{ margin: '8px 0 6px' }}>
              <span>Cell <b>({cell.r}, {cell.c})</b></span>
              <span>Left to fill <b>{puz.cells.length - i}</b></span>
            </div>
            <div className="row">
              {puz.opts[i].map((v) => <button key={v} className="btn optbtn" onClick={() => choose(v)}>{v}</button>)}
              <HintButton onHint={() => hint(`the outlined cells hold ${cell.deps.map(([r, c]) => `(${r},${c}) = ${filled[`${r},${c}`]}`).join(', ')}. Rule: ${puz.formula}`)} />
            </div>
          </>
        )}
      </div>
      <Result end={end} onAgain={again} />
    </>
  )
}
