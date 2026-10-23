import { expect, test } from '@playwright/test'
import { createProfile } from './helpers'

const SIZES = [
  ['phone 360', 360, 740],
  ['phone 390', 390, 844],
  ['tablet 768', 768, 1024],
  ['laptop 1280', 1280, 800],
]
const VIEWS = ['Map', 'Campaign', 'Sorting Hall', 'Binary Vault', 'The Keep', 'Root Crypt', 'Labyrinth', 'Hash Forge', 'DP Dungeon', 'Scribe Tower', 'Linked List Lab', 'Bit Bunker', 'Big-O Blitz', 'Pattern Match', 'Memory Match', 'Stack Defender', 'Bug Hunt', 'Graph Builder', 'Trie Tunnel', 'Union Yard', 'Backtrack Bastion', 'Heap Hollow', 'Campaign', 'Daily', 'Boss Rush', 'Leaderboard', 'Quiz', 'Analytics', 'Tome', 'Ledger', 'Settings']

for (const [name, w, h] of SIZES) {
  test(`no horizontal page overflow on any screen (${name})`, async ({ page }) => {
    test.setTimeout(120000)
    await page.setViewportSize({ width: w, height: h })
    await createProfile(page)
    const bad = []
    const check = async (label) => {
      await page.waitForTimeout(120)
      const r = await page.evaluate(() => {
        const de = document.documentElement
        const over = de.scrollWidth - de.clientWidth
        let who = ''
        if (over > 1) {
          const vw = de.clientWidth
          const el = [...document.querySelectorAll('main *, .top *')].find((e) => e.getBoundingClientRect().right > vw + 1 && !e.closest('.scroll, .nav, .codebox, .editor, pre'))
          who = el ? `${el.tagName.toLowerCase()}.${el.className && el.className.baseVal === undefined ? el.className : ''}` : 'unknown'
        }
        return { over, who }
      })
      if (r.over > 1) bad.push(`${label}: +${r.over}px ${r.who}`)
    }
    for (const v of VIEWS) {
      await page.locator('nav').getByRole('button', { name: v, exact: true }).click()
      await check(v)
    }
    await page.locator('.who').first().click()
    await check('Account')
    expect(bad).toEqual([])
  })
}

test('phone: the navigation strip scrolls and the result dialog fits the screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await createProfile(page)
  const nav = page.locator('nav.nav')
  expect(await nav.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true)
  expect(await nav.evaluate((e) => getComputedStyle(e).position)).toBe('sticky')
  await page.locator('nav').getByRole('button', { name: 'Hash Forge', exact: true }).click()
  for (let k = 0; k < 8; k++) {
    const key = Number((await page.locator('.big').first().textContent()).match(/\d+/)[0])
    await page.getByLabel(`Bucket ${key % 7}`).click()
  }
  const dlg = page.getByRole('dialog', { name: 'Result' })
  await expect(dlg).toBeVisible()
  const box = await dlg.boundingBox()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(360)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(640)
  await expect(page.getByRole('button', { name: 'Back to map' })).toBeInViewport()
})
