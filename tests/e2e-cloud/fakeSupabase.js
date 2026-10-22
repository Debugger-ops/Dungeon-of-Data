// A small in-memory Supabase (GoTrue + PostgREST) served through Playwright routing, so the cloud features can be
// tested end to end without a real project. It implements only what the app calls.
export const URL_BASE = 'http://127.0.0.1:54321'
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' }
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')

export function newDb() {
  return { users: [], tables: { saves: [], leaderboard: [], daily_scores: [] }, calls: [] }
}

const session = (u) => {
  const exp = Math.floor(Date.now() / 1000) + 3600
  return {
    access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: u.id, email: u.email, role: 'authenticated', aud: 'authenticated', exp })}.sig`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    refresh_token: `r-${u.id}`,
    user: { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
  }
}

const parseFilter = (params) => {
  const fs = []
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'on_conflict'].includes(k)) continue
    const m = /^(eq|gt)\.(.*)$/.exec(v)
    if (!m) continue
    fs.push((r) => (m[1] === 'eq' ? String(r[k]) === m[2] : Number(r[k]) > Number(m[2])))
  }
  return (r) => fs.every((f) => f(r))
}

export async function install(context, db) {
  await context.route(`${URL_BASE}/**`, async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const json = (status, body) => route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: body === undefined ? '' : JSON.stringify(body) })
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    db.calls.push(`${req.method()} ${url.pathname}`)
    const body = req.postData() ? JSON.parse(req.postData()) : null

    if (url.pathname === '/auth/v1/signup') {
      if (db.users.some((u) => u.email === body.email)) return json(422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' })
      const u = { id: `u${db.users.length + 1}-0000-4000-8000-000000000000`, email: body.email, password: body.password }
      db.users.push(u)
      return json(200, session(u))
    }
    if (url.pathname === '/auth/v1/token') {
      const u = body.refresh_token ? db.users.find((x) => `r-${x.id}` === body.refresh_token) : db.users.find((x) => x.email === body.email && x.password === body.password)
      return u ? json(200, session(u)) : json(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' })
    }
    if (url.pathname === '/auth/v1/user') {
      const tok = (req.headers().authorization || '').replace('Bearer ', '').split('.')[1]
      const id = tok ? JSON.parse(Buffer.from(tok, 'base64url').toString()).sub : null
      const u = db.users.find((x) => x.id === id)
      return u ? json(200, session(u).user) : json(401, { msg: 'no' })
    }
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers: CORS })

    const m = /^\/rest\/v1\/(\w+)$/.exec(url.pathname)
    if (!m || !db.tables[m[1]]) return json(404, { message: 'not found' })
    const t = m[1]
    const match = parseFilter(url.searchParams)
    if (req.method() === 'GET') {
      let rows = db.tables[t].filter(match).map((r) => ({ ...r }))
      const order = (url.searchParams.get('order') || '').split(',').filter(Boolean).map((o) => o.split('.'))
      order.slice().reverse().forEach(([c, d]) => rows.sort((a, b2) => (a[c] > b2[c] ? 1 : a[c] < b2[c] ? -1 : 0) * (d === 'desc' ? -1 : 1)))
      const lim = Number(url.searchParams.get('limit') || 1000)
      rows = rows.slice(0, lim)
      return json(200, rows)
    }
    if (req.method() === 'POST') {
      const keys = (url.searchParams.get('on_conflict') || 'user_id').split(',')
      const list = Array.isArray(body) ? body : [body]
      list.forEach((row) => {
        const i = db.tables[t].findIndex((r) => keys.every((k) => r[k] === row[k]))
        if (i >= 0) db.tables[t][i] = { ...db.tables[t][i], ...row }
        else db.tables[t].push({ ...row })
      })
      return route.fulfill({ status: 201, headers: CORS })
    }
    if (req.method() === 'PATCH') {
      db.tables[t] = db.tables[t].map((r) => (match(r) ? { ...r, ...body } : r))
      return route.fulfill({ status: 204, headers: CORS })
    }
    if (req.method() === 'DELETE') {
      db.tables[t] = db.tables[t].filter((r) => !match(r))
      return route.fulfill({ status: 204, headers: CORS })
    }
    return json(405, {})
  })
}
