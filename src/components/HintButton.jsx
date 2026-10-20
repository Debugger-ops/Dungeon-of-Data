// Reveals a hint through the room's status line. Using one caps the round's stars (see useRound).
export default function HintButton({ onHint, disabled }) {
  return (
    <button className="btn" disabled={disabled} onClick={onHint} title="A hint caps this round at 2 stars">
      Hint
    </button>
  )
}
