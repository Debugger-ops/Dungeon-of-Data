// Bars are keyed by value so React moves the same DOM node when positions change,
// which lets the CSS `left` transition animate swaps.
export default function Bars({ vals, arr, roles = {}, onPick }) {
  const n = vals.length
  const mx = Math.max(...vals)
  return (
    <div className="bars">
      {vals.map((v) => {
        const i = arr.indexOf(v)
        return (
          <div
            key={v}
            className={`bar ${roles[i] || ''}`}
            style={{ left: `calc(${i} * 100% / ${n})`, width: `calc(100% / ${n} - 4px)`, height: `${16 + (v / mx) * 84}%` }}
            onClick={() => onPick && onPick(i)}
          >
            <span>{v}</span>
          </div>
        )
      })}
    </div>
  )
}
