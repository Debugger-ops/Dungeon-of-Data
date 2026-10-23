import { useEffect, useRef, useState } from 'react'
import { sfx } from './lib/sfx'

// Shared question flow. instant=true shows the answer after each question (Review); otherwise answers are revealed at the end (Interview).
export default function QuizRunner({ qs, instant, seconds, onDone, nameOf }) {
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [answers, setAnswers] = useState([])
  const [left, setLeft] = useState(seconds || 0)
  const doneRef = useRef(false)
  const finish = (a) => { if (!doneRef.current) { doneRef.current = true; onDone(a) } }
  useEffect(() => {
    if (!seconds) return
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [seconds])
  useEffect(() => {
    if (seconds && left <= 0) finish(qs.map((q, k) => answers[k] || { id: q.id, room: q.room, ok: false, skipped: true }))
  }, [left])

  const q = qs[i]
  if (!q) return null
  const record = (k) => {
    const a = [...answers, { id: q.id, room: q.room, ok: k === q.answer, pick: k }]
    setAnswers(a)
    setChosen(null)
    if (i + 1 >= qs.length) finish(a)
    else setI(i + 1)
  }
  const pick = (k) => {
    if (instant) { if (chosen === null) { sfx(k === q.answer ? 'hit' : 'miss'); setChosen(k) } } else record(k)
  }
  const answered = chosen !== null
  return (
    <div className="card">
      <div className="statrow">
        <span>Question <b>{i + 1}/{qs.length}</b></span>
        {nameOf && <span>Room <b>{nameOf(q.room)}</b></span>}
        {seconds ? <span>Time left <b data-testid="timeleft" style={{ color: left <= 30 ? 'var(--bad)' : undefined }}>{Math.floor(Math.max(left, 0) / 60)}:{String(Math.max(left, 0) % 60).padStart(2, '0')}</b></span> : null}
      </div>
      <h3 style={{ marginBottom: 10 }}>{q.q}</h3>
      <div className="quizopts">
        {q.opts.map((o, k) => {
          const cls = !instant || !answered ? '' : k === q.answer ? 'right' : k === chosen ? 'wrong' : 'dim'
          return <button key={o} className={`qopt ${cls}`} onClick={() => pick(k)} disabled={answered && cls === 'dim'}><kbd className="kbd">{k + 1}</kbd> {o}</button>
        })}
      </div>
      {instant && answered && (
        <>
          <div className={`msg ${chosen === q.answer ? 'ok' : 'bad'}`} style={{ marginTop: 10 }}>{chosen === q.answer ? 'Correct. ' : `Not quite. The answer is "${q.opts[q.answer]}". `}{q.why}</div>
          <button className="btn primary" style={{ marginTop: 8 }} onClick={() => record(chosen)}>{i + 1 >= qs.length ? 'Finish' : 'Next'}</button>
        </>
      )}
    </div>
  )
}
