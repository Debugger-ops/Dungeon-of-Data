import { useState } from 'react'
import { useProgress } from './progress'
import { BANK_SIZE, QUIZ_LEN, buildQuiz, roomWeights } from './lib/quiz'
import { ROOMS } from './lib/rooms'
import { HBars } from './components/Charts'
import { sfx } from './lib/sfx'

const nameOf = (id) => ROOMS.find((r) => r.id === id).name

export default function Quiz() {
  const { S, go, awardQuiz } = useProgress()
  const [qs, setQs] = useState(null)
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [answers, setAnswers] = useState([])
  const [gain, setGain] = useState(null)

  const weights = roomWeights(S)
  const start = () => {
    setQs(buildQuiz(S))
    setI(0)
    setChosen(null)
    setAnswers([])
    setGain(null)
  }
  const head = (
    <div className="roomhead">
      <div>
        <h2>Scholar's Quiz</h2>
        <p className="lede">{QUIZ_LEN} quick questions on Big-O and concepts. Rooms where your accuracy is lowest come up more often. Each correct answer earns 5 XP, a perfect quiz adds 10.</p>
      </div>
      <button className="btn ghost" onClick={() => go('map')}>← Map</button>
    </div>
  )

  if (!qs) {
    const weak = [...weights].sort((a, b) => (a.acc ?? 0.5) - (b.acc ?? 0.5)).slice(0, 3)
    return (
      <>
        {head}
        <div className="card">
          <h3>Focus rooms</h3>
          <p className="lede" style={{ margin: '4px 0 8px' }}>Weighted by your accuracy so far. Unplayed rooms get a medium weight.</p>
          <div className="scroll">
            <table>
              <thead><tr><th>Room</th><th className="num">Accuracy</th><th className="num">Question weight</th></tr></thead>
              <tbody>
                {weights.map((w) => (
                  <tr key={w.id}>
                    <td>{w.name}{weak.some((x) => x.id === w.id) ? ' (focus)' : ''}</td>
                    <td className="num">{w.acc === null ? 'no data' : `${Math.round(w.acc * 100)}%`}</td>
                    <td className="num">{w.w.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="statrow" style={{ marginTop: 10 }}>
            <span>Quizzes taken <b>{S.quiz.taken}</b></span>
            <span>Perfect <b>{S.quiz.perfect}</b></span>
            <span>Question bank <b>{BANK_SIZE}</b></span>
          </div>
          <button className="btn primary" onClick={start}>Start quiz</button>
        </div>
      </>
    )
  }

  if (i >= qs.length) {
    const correct = answers.filter((a) => a.ok).length
    const byRoom = ROOMS.map((r) => {
      const a = answers.filter((x) => x.room === r.id)
      return { name: r.name.split(' ').slice(-1)[0], v: [a.filter((x) => x.ok).length, a.length - a.filter((x) => x.ok).length], n: a.length }
    }).filter((g) => g.n)
    return (
      <>
        {head}
        <div className="card">
          <h3>{correct} / {qs.length} correct</h3>
          <p className="gain" style={{ margin: '6px 0' }}>+{gain} XP</p>
          <HBars groups={byRoom} series={[['Correct', 'var(--ok)'], ['Missed', 'var(--bad)']]} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn primary" onClick={start}>Another quiz</button>
            <button className="btn" onClick={() => go('map')}>Back to map</button>
          </div>
        </div>
      </>
    )
  }

  const q = qs[i]
  const answered = chosen !== null
  const pick = (k) => {
    if (answered) return
    sfx(k === q.answer ? 'hit' : 'miss')
    setChosen(k)
  }
  const next = () => {
    const a = [...answers, { id: q.id, room: q.room, ok: chosen === q.answer }]
    setAnswers(a)
    setChosen(null)
    if (i + 1 >= qs.length) setGain(awardQuiz(a))
    setI(i + 1)
  }

  return (
    <>
      {head}
      <div className="card">
        <div className="statrow">
          <span>Question <b>{i + 1}/{qs.length}</b></span>
          <span>Room <b>{nameOf(q.room)}</b></span>
          <span>Correct so far <b>{answers.filter((a) => a.ok).length}</b></span>
        </div>
        <h3 style={{ marginBottom: 10 }}>{q.q}</h3>
        <div className="quizopts">
          {q.opts.map((o, k) => {
            const cls = !answered ? '' : k === q.answer ? 'right' : k === chosen ? 'wrong' : 'dim'
            return <button key={o} className={`qopt ${cls}`} onClick={() => pick(k)} disabled={answered && cls === 'dim'}>{o}</button>
          })}
        </div>
        {answered && (
          <>
            <div className={`msg ${chosen === q.answer ? 'ok' : 'bad'}`} style={{ marginTop: 10 }}>
              {chosen === q.answer ? 'Correct. ' : `Not quite. The answer is "${q.opts[q.answer]}". `}
              {q.why}
            </div>
            <button className="btn primary" style={{ marginTop: 8 }} onClick={next}>{i + 1 >= qs.length ? 'Finish' : 'Next question'}</button>
          </>
        )}
      </div>
    </>
  )
}
