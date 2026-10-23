import { useMemo, useState } from 'react'
import { useProgress } from './progress'
import { dueIds } from './lib/review'
import { questionById } from './lib/quiz'
import { ROOMS } from './lib/rooms'
import { dayKey } from './lib/util'
import QuizRunner from './QuizRunner'

const nameOf = (id) => ROOMS.find((r) => r.id === id).name

// Spaced repetition: questions you miss in the quiz or interview land here and come back on a schedule until you master them.
export default function Review() {
  const { S, go, reviewDone } = useProgress()
  const deck = Object.keys(S.review).length
  const due = useMemo(() => dueIds(S.review, dayKey()).map(questionById).filter(Boolean).slice(0, 10), [])
  const [state, setState] = useState('idle') // idle | run | done
  const [res, setRes] = useState(null)
  const finish = (items) => { setRes({ right: items.filter((a) => a.ok).length, total: items.length, gain: reviewDone(items) }); setState('done') }
  return (
    <>
      <div className="roomhead">
        <div><h2>Review</h2><p className="lede">Questions you got wrong come back after 1, 2, 4, 8 and 16 days. Answer right each time and they leave the deck for good. 3 XP per correct answer.</p></div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      {state === 'idle' && (
        <div className="card">
          <div className="statrow"><span>In your deck <b data-testid="deck">{deck}</b></span><span>Due today <b>{due.length}</b></span></div>
          {deck === 0 && <p className="fine">Nothing to review yet. Take a Scholar's Quiz or an Interview: every question you miss lands here.</p>}
          {deck > 0 && due.length === 0 && <p className="fine">Nothing is due today. Come back tomorrow.</p>}
          <div className="row">
            <button className="btn primary" disabled={due.length === 0} onClick={() => setState('run')}>Start review</button>
            <button className="btn" onClick={() => go('quiz')}>Take a quiz</button>
          </div>
        </div>
      )}
      {state === 'run' && <QuizRunner qs={due} instant onDone={finish} nameOf={nameOf} />}
      {state === 'done' && (
        <div className="card" role="status">
          <h3>{res.right} / {res.total} correct</h3>
          <p className="gain">+{res.gain} XP</p>
          <button className="btn primary" onClick={() => go('map')}>Back to map</button>
        </div>
      )}
    </>
  )
}
