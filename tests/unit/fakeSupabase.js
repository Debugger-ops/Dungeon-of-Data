// A tiny in-memory stand-in for the parts of supabase-js that lib/sync.js uses.
export function fakeClient() {
  const db = { saves: [], leaderboard: [], daily_scores: [] }
  const from = (table) => {
    const filters = []
    const ord = []
    let lim = Infinity
    let op = 'select'
    let payload
    let keys = []
    const run = () => {
      const all = db[table]
      const match = (r) => filters.every((f) => f(r))
      if (op === 'upsert') {
        const i = all.findIndex((r) => keys.every((k) => r[k] === payload[k]))
        if (i >= 0) all[i] = { ...all[i], ...payload }
        else all.push({ ...payload })
        return { data: null, error: null }
      }
      if (op === 'delete') {
        db[table] = all.filter((r) => !match(r))
        return { data: null, error: null }
      }
      if (op === 'update') {
        all.forEach((r, i) => match(r) && (all[i] = { ...r, ...payload }))
        return { data: null, error: null }
      }
      let rows = all.filter(match).map((r) => ({ ...r }))
      ord.slice().reverse().forEach(([c, asc]) => rows.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1)))
      rows = rows.slice(0, lim)
      return { data: rows, error: null }
    }
    const b = {
      select: () => b,
      eq: (c, v) => (filters.push((r) => r[c] === v), b),
      gt: (c, v) => (filters.push((r) => r[c] > v), b),
      order: (c, o = {}) => (ord.push([c, o.ascending !== false]), b),
      limit: (n) => ((lim = n), b),
      upsert: (row, o) => ((op = 'upsert'), (payload = row), (keys = o.onConflict.split(',')), b),
      delete: () => ((op = 'delete'), b),
      update: (p) => ((op = 'update'), (payload = p), b),
      maybeSingle: () => Promise.resolve(run()).then((r) => ({ data: r.data ? r.data[0] || null : null, error: null })),
      then: (res, rej) => Promise.resolve(run()).then(res, rej),
    }
    return b
  }
  return { from, db }
}
