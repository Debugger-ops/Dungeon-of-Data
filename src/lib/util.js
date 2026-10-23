// Random source. Daily challenges swap in a seeded generator so everyone gets the same puzzle.
let rng = Math.random
export const rnd = () => rng()
export const seedRng = (seed) => {
  let a = seed >>> 0
  rng = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const unseedRng = () => {
  rng = Math.random
}
export const hashStr = (str) => {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}
export const rand = (a, b) => a + Math.floor(rng() * (b - a + 1))
// Local calendar day as YYYY-MM-DD.
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const prevDay = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d - 1))
}
// Monday of the current week as YYYY-MM-DD.
export const weekKey = (d = new Date()) => {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
  return dayKey(m)
}
export const shuffle = (a) => {
  a = a.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
export const uniq = (n, lo, hi) => {
  const s = new Set()
  while (s.size < n) s.add(rand(lo, hi))
  return [...s]
}
export const stars = (n) => '★'.repeat(n) + '☆'.repeat(3 - n)
export const starsBad = (b) => (b === 0 ? 3 : b <= 1 ? 2 : 1)
