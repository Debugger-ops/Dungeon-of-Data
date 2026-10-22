import { useContext, useState } from 'react'
import { LevelFlag } from '../level'
import { useProgress } from '../progress'

// Page frame for a room: title, mode chips, and a body that renders the active mode.
export default function Room({ title, lede, modes, children }) {
  const { go } = useProgress()
  const lv = useContext(LevelFlag)
  const [mode, setMode] = useState(lv && modes.some((m) => m[0] === lv.level.mode) ? lv.level.mode : modes[0][0])
  return (
    <>
      <div className="roomhead">
        <div>
          <h2>{title}</h2>
          <p className="lede">{lede}</p>
        </div>
        <button className="btn ghost" onClick={() => (lv ? lv.back() : go('map'))}>{lv ? '← Levels' : '← Map'}</button>
      </div>
      {modes.length > 1 && !lv && (
        <div className="chips">
          {modes.map(([k, label]) => (
            <button key={k} className={`chip ${k === mode ? 'on' : ''}`} onClick={() => setMode(k)}>{label}</button>
          ))}
        </div>
      )}
      <div className="body">{children(mode)}</div>
    </>
  )
}
