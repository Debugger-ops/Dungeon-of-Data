import { stars } from '../lib/util'
import { useProgress } from '../progress'

export default function Result({ end, onAgain }) {
  const { go } = useProgress()
  if (!end) return null
  return (
    <div className="overlay">
      <div className={`card result ${end.win ? 'win' : 'lose'}`} role="dialog" aria-label="Result">
        <h3>{end.win ? 'The wave is broken' : 'The keep has fallen'}</h3>
        <div className="stars">{end.win ? stars(end.stars) : '☆☆☆'}</div>
        <p>{end.text}</p>
        <p className="gain">+{end.gain} XP</p>
        <div className="row">
          <button className="btn primary" onClick={onAgain}>Play again</button>
          <button className="btn" onClick={() => go('map')}>Back to map</button>
        </div>
      </div>
    </div>
  )
}
