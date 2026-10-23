// Leitner boxes: a question moves up a box when answered right and drops back to box 0 when missed.
// Gaps in days between reviews for boxes 0..4.
export const GAPS = [1, 2, 4, 8, 16]
const addDays = (key, n) => {
  const [y, m, d] = key.split('-').map(Number)
  const t = new Date(y, m - 1, d + n)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}
// items: { [id]: { box, due } }. Only questions you have missed enter the deck.
export function record(review, id, ok, today) {
  const cur = review[id]
  if (!cur && ok) return review
  const box = ok ? Math.min(GAPS.length - 1, cur.box + 1) : 0
  if (ok && cur.box >= GAPS.length - 1) {
    const { [id]: _, ...rest } = review
    return rest // mastered: leaves the deck
  }
  return { ...review, [id]: { box, due: addDays(today, GAPS[box]) } }
}
export const dueIds = (review, today) => Object.entries(review).filter(([, v]) => v.due <= today).map(([id]) => id)
