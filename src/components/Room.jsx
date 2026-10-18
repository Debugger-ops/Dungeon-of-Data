import { useState } from 'react'
import { useProgress } from '../progress'

// Page frame for a room: title, mode chips, and a body that renders the active mode.
export default function Room({ title, lede, modes, children }) {
  const { go } = useProgress()
  const [mode, setMode] = useState(modes[0][0])
  return (
    <>
      <div className="roomhead">
        <div>
          <h2>{title}</h2>
          <p className="lede">{lede}</p>
        </div>
        <button className="btn ghost" onClick={() => go('map')}>← Map</button>
      </div>
      {modes.length > 1 && (
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
