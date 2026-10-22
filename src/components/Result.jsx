import { useContext, useState } from 'react'
import { RushFlag } from '../rush'
import { LevelFlag } from '../level'
import { nextLevel } from '../lib/campaign'
import { stars } from '../lib/util'
import { liveStreak, useProgress } from '../progress'
import { share, shareText } from '../lib/share'

export default function Result({ end, onAgain }) {
  const { go, S } = useProgress()
  const rush = useContext(RushFlag)
  const lv = useContext(LevelFlag)
  const [note, setNote] = useState('')
  if (!end) return null
  const doShare = async () => {
    const r = await share(shareText({ room: end.room, stars: end.stars, gain: end.gain, streak: liveStreak(S), daily: end.daily, url: location.origin + location.pathname }))
    setNote(r === 'copied' ? 'Copied to clipboard' : r === 'shared' ? 'Shared' : r === 'failed' ? 'Could not copy' : '')
  }
  return (
    <div className="overlay">
      <div className={`card result ${end.win ? 'win' : 'lose'}`} role="dialog" aria-label="Result">
        <h3>{end.win ? 'The wave is broken' : 'The keep has fallen'}</h3>
        <div className="stars">{end.win ? stars(end.stars) : '☆☆☆'}</div>
        <p>{end.text}</p>
        <p className="gain">+{end.gain} XP</p>
        <div className="row">
          {lv ? (
            <>
              {end.win && nextLevel(lv.level.id) && <button className="btn primary" onClick={lv.next}>Next level</button>}
              {end.win && !nextLevel(lv.level.id) && <button className="btn primary" onClick={lv.back}>Campaign complete</button>}
              {!end.win && <button className="btn primary" onClick={lv.retry}>Retry level</button>}
              {end.win && <button className="btn" onClick={lv.retry}>Replay for stars</button>}
              <button className="btn" onClick={lv.back}>Level map</button>
            </>
          ) : rush ? (
            end.win ? (
              <button className="btn primary" onClick={rush.last ? () => rush.finish(true) : rush.next}>{rush.last ? 'Claim the bonus' : 'Next room'}</button>
            ) : (
              <button className="btn primary" onClick={() => rush.finish(false)}>See rush result</button>
            )
          ) : (
            <>
              <button className="btn primary" onClick={onAgain}>Play again</button>
              <button className="btn" onClick={() => go('map')}>Back to map</button>
            </>
          )}
          {end.win && <button className="btn" onClick={doShare}>Share result</button>}
        </div>
        <div className="fine" role="status" aria-live="polite" style={{ minHeight: '1.4em' }}>{note}</div>
      </div>
    </div>
  )
}
