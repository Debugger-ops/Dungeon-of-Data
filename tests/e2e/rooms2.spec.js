import { expect, test } from '@playwright/test'
import { createProfile } from './helpers'
import { REV } from '../../src/lib/list.js'
import { BIGO } from '../../src/lib/bigo.js'
import { BUGS, bugLine } from '../../src/lib/bugs.js'

const nav = (page, label) => page.locator('nav').getByRole('button', { name: label, exact: true }).click()
const open = async (page, room, mode) => {
  await createProfile(page)
  await nav(page, room)
  if (mode) await page.getByRole('button', { name: mode, exact: true }).click()
}
const won = (page) => expect(page.getByText('The wave is broken')).toBeVisible()

test('linked list lab: reverse, delete and insert can all be won', async ({ page }) => {
  await open(page, 'Linked List Lab')
  for (let i = 0; i < 16; i++) await page.getByRole('button', { name: REV[i % 4].code, exact: true }).click()
  await won(page)
  await page.getByRole('button', { name: 'Play again' }).click()

  await page.getByRole('button', { name: 'Delete a node', exact: true }).click()
  for (let k = 0; k < 5; k++) {
    const target = (await page.locator('.big').first().textContent()).trim()
    const nodes = await page.locator('button.lnode[aria-label^="Node"]').evaluateAll((els) => els.map((e) => e.textContent))
    const idx = nodes.indexOf(target)
    await page.getByRole('button', { name: idx === 0 ? 'Head pointer' : `Node ${nodes[idx - 1]}` }).click()
  }
  await won(page)
  await page.getByRole('button', { name: 'Play again' }).click()

  await page.getByRole('button', { name: 'Insert in order', exact: true }).click()
  for (let k = 0; k < 5; k++) {
    const v = Number((await page.locator('.big').first().textContent()).trim())
    const nodes = (await page.locator('.lnode.static:not(.null)').allTextContents()).map(Number)
    const gap = nodes.filter((x) => x < v).length
    await page.getByRole('button', { name: gap === nodes.length ? 'Insert at the end' : `Insert before ${nodes[gap]}` }).click()
  }
  await won(page)
})

test('bit bunker: solving bit operations wins', async ({ page }) => {
  await open(page, 'Bit Bunker')
  for (let k = 0; k < 6; k++) {
    const t = (await page.locator('main h3').first().textContent()).replace(/\(keep 8 bits\)/, '').trim()
    let r
    let m
    if ((m = /^(\d+) & (\d+)$/.exec(t))) r = m[1] & m[2]
    else if ((m = /^(\d+) \| (\d+)$/.exec(t))) r = m[1] | m[2]
    else if ((m = /^(\d+) \^ (\d+)$/.exec(t))) r = m[1] ^ m[2]
    else if ((m = /^(\d+) << (\d+)$/.exec(t))) r = (m[1] << m[2]) & 255
    else if ((m = /^(\d+) >> (\d+)$/.exec(t))) r = m[1] >> m[2]
    else if ((m = /^~(\d+)$/.exec(t))) r = ~m[1] & 255
    else throw new Error(`unparsed ${t}`)
    const bits = r.toString(2).padStart(8, '0')
    for (let i = 0; i < 8; i++) if (bits[i] === '1') await page.getByRole('button', { name: `Bit ${7 - i}`, exact: true }).click()
    await expect(page.getByTestId('bitvalue')).toHaveText(String(r))
    await page.getByRole('button', { name: 'Check', exact: true }).click()
  }
  await won(page)
})

test('big-o blitz: right answers win, a timeout costs a tile', async ({ page }) => {
  await open(page, 'Big-O Blitz')
  for (let k = 0; k < 10; k++) {
    const code = await page.getByTestId('snippet').textContent()
    const item = BIGO.find((b) => b.code === code)
    await page.getByRole('group', { name: 'Time complexity' }).getByRole('button', { name: item.ans, exact: true }).click()
  }
  await won(page)
})

test('big-o blitz: the clock runs out', async ({ page }) => {
  await page.clock.install()
  await open(page, 'Big-O Blitz')
  await page.clock.runFor(16000)
  await expect(page.getByText('Time is up.')).toBeVisible()
})

test('pattern match: two pointers and sliding window can be won', async ({ page }) => {
  await open(page, 'Pattern Match')
  for (let g = 0; g < 20; g++) {
    if (await page.getByText('The wave is broken').isVisible()) break
    const sum = Number(await page.getByTestId('tpsum').textContent())
    const target = Number((await page.locator('.big').first().textContent()).trim())
    const label = sum === target ? /found it/ : sum < target ? /too small/ : /too big/
    await page.getByRole('button', { name: label }).click()
  }
  await won(page)
  await page.getByRole('button', { name: 'Play again' }).click()

  await page.getByRole('button', { name: 'Sliding window', exact: true }).click()
  for (let g = 0; g < 6; g++) {
    const sum = Number(await page.getByTestId('winsum').textContent())
    const marks = await page.locator('.acell.mk small').allTextContents()
    const leaving = Number(marks.find((x) => x.startsWith('-')).slice(1))
    const entering = Number(marks.find((x) => x.startsWith('+')).slice(1))
    await page.locator('.optbtn', { hasText: new RegExp(`^${sum - leaving + entering}$`) }).click()
  }
  await won(page)
})

test('memory match: pairing every card wins; a wrong pair is counted', async ({ page }) => {
  await open(page, 'Memory Match')
  await page.locator('[data-pair="0"]').first().click()
  const other = await page.locator('.mcard').evaluateAll((els) => els.find((e) => e.getAttribute('data-pair') !== '0' && e.getAttribute('data-pair') !== null).getAttribute('data-pair'))
  await page.locator(`[data-pair="${other}"]`).first().click()
  await expect(page.getByTestId('misses')).toHaveText('1')
  await page.waitForTimeout(900)
  for (let p = 0; p < 8; p++) {
    await page.locator(`[data-pair="${p}"]`).nth(0).click()
    await page.locator(`[data-pair="${p}"]`).nth(1).click()
  }
  await won(page)
})

test('stack defender: bracket guard and postfix calculator can be won', async ({ page }) => {
  await open(page, 'Stack Defender')
  const OPEN = '([{'
  const CLOSE = { ')': '(', ']': '[', '}': '{' }
  for (let s = 0; s < 3; s++) {
    const str = (await page.locator('.tokens').getAttribute('aria-label')).replace('String ', '')
    const st = []
    let rejected = false
    for (const c of str) {
      if (OPEN.includes(c)) { st.push(c); await page.getByRole('button', { name: 'Push', exact: true }).click() }
      else if (st[st.length - 1] === CLOSE[c]) { st.pop(); await page.getByRole('button', { name: 'Pop', exact: true }).click() }
      else { await page.getByRole('button', { name: 'Reject', exact: true }).click(); rejected = true; break }
    }
    if (!rejected) await page.getByRole('button', { name: st.length ? 'Reject' : 'Accept', exact: true }).click()
  }
  await won(page)
  await page.getByRole('button', { name: 'Play again' }).click()

  await page.getByRole('button', { name: 'Postfix calculator', exact: true }).click()
  const tokens = (await page.locator('.tokens').getAttribute('aria-label')).replace('Postfix ', '').split(' ')
  const st = []
  for (const t of tokens) {
    if (/^\d+$/.test(t)) st.push(Number(t))
    else {
      const b = st.pop()
      const a = st.pop()
      const v = t === '+' ? a + b : t === '-' ? a - b : a * b
      st.push(v)
      await page.locator('.optbtn', { hasText: new RegExp(`^${v}$`) }).click()
    }
  }
  await won(page)
})

test('bug hunt: clicking each buggy line wins', async ({ page }) => {
  await open(page, 'Bug Hunt')
  for (let k = 0; k < 5; k++) {
    const title = (await page.locator('main h3').first().textContent()).replace(/\s*\(\d+ of 5\)\s*$/, '').trim()
    const b = BUGS.find((x) => x.title === title)
    await page.getByRole('button', { name: new RegExp(`^Line ${bugLine(b) + 1}:`) }).click()
    if (k < 4) await page.getByRole('button', { name: 'Next bug' }).click()
  }
  await won(page)
})

test('graph builder: Dijkstra and Kruskal can be won', async ({ page }) => {
  await open(page, 'Graph Builder')
  const parse = async () => {
    const lab = await page.locator('svg.wgraph').getAttribute('aria-label')
    const edges = [...lab.matchAll(/([A-F]) to ([A-F]) weight (\d+)/g)].map((m) => ({ a: m[1].charCodeAt(0) - 65, b: m[2].charCodeAt(0) - 65, w: Number(m[3]) }))
    return edges
  }
  let edges = await parse()
  const dist = Array(6).fill(Infinity)
  const done = Array(6).fill(false)
  dist[0] = 0
  for (let k = 0; k < 6; k++) {
    let u = -1
    dist.forEach((d, i) => { if (!done[i] && d < Infinity && (u < 0 || d < dist[u])) u = i })
    await page.getByRole('button', { name: `Finalize ${String.fromCharCode(65 + u)}`, exact: true }).click()
    done[u] = true
    edges.forEach((e) => { const o = e.a === u ? e.b : e.b === u ? e.a : -1; if (o >= 0 && !done[o]) dist[o] = Math.min(dist[o], dist[u] + e.w) })
  }
  await won(page)
  await page.getByRole('button', { name: 'Play again' }).click()

  await page.getByRole('button', { name: 'Cheapest network (Kruskal)', exact: true }).click()
  edges = (await parse()).sort((x, y) => x.w - y.w)
  const par = [0, 1, 2, 3, 4, 5]
  const find = (x) => (par[x] === x ? x : (par[x] = find(par[x])))
  for (const e of edges) {
    const ra = find(e.a)
    const rb = find(e.b)
    if (ra === rb) await page.getByRole('button', { name: 'Skip edge', exact: true }).click()
    else { par[ra] = rb; await page.getByRole('button', { name: 'Take edge', exact: true }).click() }
  }
  await won(page)
})

// ---- Boss Rush ----
const solveBug = async (page) => {
  for (let k = 0; k < 5; k++) {
    const title = (await page.locator('main h3').first().textContent()).replace(/\s*\(\d+ of 5\)\s*$/, '').trim()
    const b = BUGS.find((x) => x.title === title)
    await page.getByRole('button', { name: new RegExp(`^Line ${bugLine(b) + 1}:`) }).click()
    if (k < 4) await page.getByRole('button', { name: 'Next bug' }).click()
  }
}
const solveBits = async (page) => {
  for (let k = 0; k < 6; k++) {
    const t = (await page.locator('main h3').first().textContent()).replace(/\(keep 8 bits\)/, '').trim()
    let r
    let m
    if ((m = /^(\d+) & (\d+)$/.exec(t))) r = m[1] & m[2]
    else if ((m = /^(\d+) \| (\d+)$/.exec(t))) r = m[1] | m[2]
    else if ((m = /^(\d+) \^ (\d+)$/.exec(t))) r = m[1] ^ m[2]
    else if ((m = /^(\d+) << (\d+)$/.exec(t))) r = (m[1] << m[2]) & 255
    else if ((m = /^(\d+) >> (\d+)$/.exec(t))) r = m[1] >> m[2]
    else r = ~/(\d+)/.exec(t)[1] & 255
    const bits = r.toString(2).padStart(8, '0')
    for (let i = 0; i < 8; i++) if (bits[i] === '1') await page.getByRole('button', { name: `Bit ${7 - i}`, exact: true }).click()
    await page.getByRole('button', { name: 'Check', exact: true }).click()
  }
}
const solveList = async (page) => {
  for (let i = 0; i < 16; i++) await page.getByRole('button', { name: REV[i % 4].code, exact: true }).click()
}

test('boss rush: clearing three rooms pays the bonus and unlocks Rush Master', async ({ page }) => {
  await page.addInitScript(() => { window.__dodRush = ['bug', 'bits', 'list'] })
  await createProfile(page)
  await nav(page, 'Boss Rush')
  await page.getByRole('button', { name: 'Start the rush' }).click()
  await expect(page.getByTestId('rush-stage')).toHaveText('1/3')
  await solveBug(page)
  await page.getByRole('button', { name: 'Next room' }).click()
  await expect(page.getByTestId('rush-stage')).toHaveText('2/3')
  await solveBits(page)
  await page.getByRole('button', { name: 'Next room' }).click()
  await solveList(page)
  await page.getByRole('button', { name: 'Claim the bonus' }).click()
  await expect(page.getByTestId('rush-cleared')).toHaveText('3/3')
  await expect(page.getByText('+150 XP').first()).toBeVisible()
  await expect(page.getByText('Achievement unlocked: Rush Master')).toBeVisible()
})

test('boss rush: losing a room ends the run', async ({ page }) => {
  await page.addInitScript(() => { window.__dodRush = ['bigo', 'bug', 'bits'] })
  await createProfile(page)
  await nav(page, 'Boss Rush')
  await page.getByRole('button', { name: 'Start the rush' }).click()
  for (let k = 0; k < 8; k++) {
    if (await page.getByText('The keep has fallen').isVisible()) break
    const code = await page.getByTestId('snippet').textContent()
    const item = BIGO.find((b) => b.code === code)
    const wrong = item.ans === 'O(1)' ? 'O(n)' : 'O(1)'
    await page.getByRole('group', { name: 'Time complexity' }).getByRole('button', { name: wrong, exact: true }).click()
  }
  await expect(page.getByText('The keep has fallen')).toBeVisible()
  await page.getByRole('button', { name: 'See rush result' }).click()
  await expect(page.getByTestId('rush-cleared')).toHaveText('0/3')
})

// ---- Campaign ----
const playHash = async (page) => {
  for (let k = 0; k < 8; k++) {
    const key = Number((await page.locator('.big').first().textContent()).match(/\d+/)[0])
    await page.getByLabel(`Bucket ${key % 7}`).click()
  }
}

test('campaign: only level 1-1 is open, winning it unlocks 1-2 and saves stars', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'Campaign')
  await expect(page.getByTestId('camp-cleared')).toHaveText('0/25')
  await expect(page.getByRole('button', { name: /^Level 1-2, locked/ })).toBeDisabled()
  await page.getByRole('button', { name: /^Level 1-1,/ }).click()
  await expect(page.getByTestId('level-id')).toHaveText('1-1')
  await playHash(page)
  await expect(page.getByText('The wave is broken')).toBeVisible()
  await expect(page.getByText('Level 1-1 cleared')).toBeVisible()
  await page.getByRole('button', { name: 'Level map' }).click()
  await expect(page.getByTestId('camp-cleared')).toHaveText('1/25')
  await expect(page.getByRole('button', { name: /^Level 1-2,/ })).toBeEnabled()
  await expect(page.getByRole('button', { name: /^Level 1-1,.*[123] of 3 stars/ })).toBeVisible()
})

test('campaign: a level is the same puzzle on every retry and Next level moves on', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'Campaign')
  await page.getByRole('button', { name: /^Level 1-1,/ }).click()
  const first = (await page.locator('.big').first().textContent()).trim()
  for (let k = 0; k < 12; k++) {
    if (await page.getByText('The keep has fallen').isVisible()) break
    const key = Number(first.match(/\d+/)[0])
    await page.getByLabel(`Bucket ${(key + 1) % 7}`).click()
  }
  await expect(page.getByText('The keep has fallen')).toBeVisible()
  await page.getByRole('button', { name: 'Retry level' }).click()
  expect((await page.locator('.big').first().textContent()).trim()).toBe(first)
  await playHash(page)
  await page.getByRole('button', { name: 'Next level' }).click()
  await expect(page.getByTestId('level-id')).toHaveText('1-2')
})
