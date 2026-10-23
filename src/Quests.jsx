import { dayKey } from './lib/util'
import { forDay, isDone, progressOf, questsFor } from './lib/quests'
import { useProgress } from './progress'
import { sfx } from './lib/sfx'

// Three daily quests, the same for everyone on a given day. Claim each one for bonus XP.
export default function Quests() {
  const { S, claimQuest } = useProgress()
  const today = dayKey()
  const q = forDay(S.quests, today)
  const list = questsFor(today)
  const all = list.every((x) => q.claimed.includes(x.id))
  return (
    <div className="card quests">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3>Daily Quests</h3>
        <span className="fine" style={{ margin: 0 }}>{all ? 'All done. New quests tomorrow.' : `${q.claimed.length}/3 claimed · ${S.questsDone} total`}</span>
      </div>
      <ul className="qlist">
        {list.map((x) => {
          const done = isDone(x, q)
          const got = q.claimed.includes(x.id)
          const p = progressOf(x, q)
          return (
            <li key={x.id} className={got ? 'got' : done ? 'ready' : ''}>
              <div className="qtext"><b>{x.text}</b><small>{p}/{x.goal} · +{x.xp} XP</small></div>
              <div className="meter" aria-hidden="true"><i style={{ width: `${(p / x.goal) * 100}%` }} /></div>
              <button className="btn" disabled={!done || got} onClick={() => { claimQuest(x.id); sfx('badge') }} aria-label={got ? `${x.text}, claimed` : `Claim ${x.text}`}>{got ? 'Claimed' : done ? 'Claim' : 'In progress'}</button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
