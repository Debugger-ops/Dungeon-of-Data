import { useState } from 'react'
import { useProgress } from './progress'
import { mixedQuiz } from './lib/quiz'
import { ROOMS } from './lib/rooms'
import QuizRunner from './QuizRunner'

const LEN = 10
const SECONDS = 600
const nameOf = (id) => ROOMS.find((r) => r.id === id).name

// A timed, no-feedback mock interview across every topic. Review every answer at the end; misses feed the Review deck.
export default function Interview() {
  const { go, awardQuiz } = useProgress()
  const [qs, setQs] = useState(null)
  const [res, setRes] = useState(null)
  const start = () => { setRes(null); setQs(mixedQuiz(LEN)) }
  const done = (answers) => {
    const gain = awardQuiz(answers)
    setRes({ answers, gain })
  }
  return (
    <>
      <div className="roomhead">
        <div><h2>Interview Mode</h2><p className="lede">{LEN} questions from every topic in {SECONDS / 60} minutes. No feedback until the end, just like the real thing. Unanswered questions count as wrong.</p></div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      {!qs && (
        <div className="card">
          <button className="btn primary" onClick={start}>Start the interview</button>
        </div>
      )}
      {qs && !res && <QuizRunner key={qs[0].id + qs.length} qs={qs} seconds={SECONDS} onDone={done} nameOf={nameOf} />}
      {qs && res && (
        <div className="card">
          <h3 data-testid="iv-score">{res.answers.filter((a) => a.ok).length} / {qs.length} correct</h3>
          <p className="gain">+{res.gain} XP · missed questions were added to Review</p>
          <ol className="ivlist">
            {qs.map((q, k) => {
              const a = res.answers[k]
              return (
                <li key={q.id} className={a && a.ok ? 'ok' : 'bad'}>
                  <b>{q.q}</b>
                  <div className="fine">{a && a.ok ? 'Correct' : a && !a.skipped ? `You said: ${q.opts[a.pick]}` : 'Unanswered'} · Answer: {q.opts[q.answer]}</div>
                  <div className="fine">{q.why}</div>
                </li>
              )
            })}
          </ol>
          <div className="row"><button className="btn primary" onClick={start}>New interview</button><button className="btn" onClick={() => go('review')}>Open Review</button></div>
        </div>
      )}
    </>
  )
}
