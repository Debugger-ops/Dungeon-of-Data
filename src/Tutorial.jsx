import { useEffect, useState } from 'react'

const KEY = 'dungeon-of-data-tutorial-v1'
const STEPS = [
  ['Welcome to the keep', 'Goblins march toward your keep. Every room teaches a data structure or algorithm, and your correct moves slay the horde.'],
  ['Predict the next step', 'You do not read about the algorithm: you play its next move. A wrong move lets the goblins advance, so think like the algorithm.'],
  ['Stars, hints and XP', 'Fewer mistakes mean more stars and XP. A Hint always helps but caps that round at 2 stars. Rank follows total XP.'],
  ['Come back daily', 'Daily challenge, three Daily Quests, a Weekly challenge and the Review deck keep your streak and skills growing. Spend gold in the Shop on streak freezes.'],
  ['Shortcuts', 'Press 1 to 4 to choose an answer, H for a hint and N to continue after a result. Open Settings any time to replay this tour.'],
]
const seen = () => { try { return localStorage.getItem(KEY) === '1' } catch (e) { return false } }

export default function Tutorial() {
  const [open, setOpen] = useState(() => !seen())
  const [i, setI] = useState(0)
  useEffect(() => {
    const on = () => { setI(0); setOpen(true) }
    window.addEventListener('dod-tutorial', on)
    return () => window.removeEventListener('dod-tutorial', on)
  }, [])
  const close = () => {
    try { localStorage.setItem(KEY, '1') } catch (e) { /* ignore */ }
    setOpen(false)
  }
  if (!open) return null
  const [h, p] = STEPS[i]
  return (
    <div className="overlay">
      <div className="card result" role="dialog" aria-modal="true" aria-label="Tutorial">
        <p className="fine" style={{ margin: 0 }}>Step {i + 1} of {STEPS.length}</p>
        <h3>{h}</h3>
        <p>{p}</p>
        <div className="row">
          {i > 0 && <button className="btn" onClick={() => setI(i - 1)}>Back</button>}
          {i < STEPS.length - 1 ? <button className="btn primary" onClick={() => setI(i + 1)}>Next</button> : <button className="btn primary" onClick={close}>Start playing</button>}
          {i < STEPS.length - 1 && <button className="btn ghost" onClick={close}>Skip</button>}
        </div>
      </div>
    </div>
  )
}
