import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createProfile } from './helpers'

const nav = (page, label) => page.locator('nav').getByRole('button', { name: label, exact: true }).click()
const VIEWS = ['Map', 'Sorting Hall', 'Hash Forge', 'DP Dungeon', 'Scribe Tower', 'Linked List Lab', 'Bit Bunker', 'Big-O Blitz', 'Pattern Match', 'Memory Match', 'Stack Defender', 'Bug Hunt', 'Graph Builder', 'Trie Tunnel', 'Union Yard', 'Backtrack Bastion', 'Heap Hollow', 'Campaign', 'Daily', 'Boss Rush', 'Leaderboard', 'Quiz', 'Analytics', 'Tome', 'Ledger', 'Settings']

for (const theme of ['dark', 'light']) {
  test(`no detectable accessibility violations (${theme} theme)`, async ({ page }) => {
    test.setTimeout(150000)
    await createProfile(page)
    if (theme === 'light') {
      await nav(page, 'Settings')
      await page.getByRole('radio', { name: 'Light' }).click()
    }
    const found = []
    for (const v of [...VIEWS, 'account']) {
      if (v === 'account') await page.locator('.who').first().click()
      else await nav(page, v)
      await page.locator('main').first().waitFor()
      await page.waitForTimeout(450)
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      r.violations.forEach((x) => found.push(`${v}: ${x.id} (${x.impact}) x${x.nodes.length} ${x.nodes[0].target.join(' ')}`))
    }
    expect(found).toEqual([])
  })
}

test('new game screens are accessible mid-play (both themes)', async ({ page }) => {
  test.setTimeout(150000)
  await createProfile(page)
  const scan = async (where) => {
    await page.waitForTimeout(400)
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    return r.violations.map((x) => `${where}: ${x.id} (${x.impact}) ${x.nodes[0].target.join(' ')}`)
  }
  const found = []
  for (const theme of ['Dark', 'Light']) {
    await nav(page, 'Settings')
    await page.getByRole('radio', { name: theme, exact: true }).click()
    await nav(page, 'Memory Match')
    await page.locator('[data-pair="0"]').first().click()
    await page.locator('.mcard:not(.up)').first().click()
    found.push(...(await scan(`${theme} memory`)))
    await nav(page, 'Bug Hunt')
    await page.locator('.cl').nth(0).click()
    found.push(...(await scan(`${theme} bug`)))
    await nav(page, 'Graph Builder')
    await page.getByRole('button', { name: 'Finalize A', exact: true }).click()
    found.push(...(await scan(`${theme} dijkstra`)))
    await page.getByRole('button', { name: 'Cheapest network (Kruskal)', exact: true }).click()
    await page.getByRole('button', { name: 'Take edge', exact: true }).click()
    found.push(...(await scan(`${theme} kruskal`)))
    await nav(page, 'Stack Defender')
    await page.getByRole('button', { name: 'Pop', exact: true }).click()
    found.push(...(await scan(`${theme} stack`)))
    await nav(page, 'Bit Bunker')
    await page.getByRole('button', { name: 'Bit 0', exact: true }).click()
    found.push(...(await scan(`${theme} bits`)))
    await nav(page, 'Linked List Lab')
    await page.getByRole('button', { name: REVCODE, exact: true }).click()
    found.push(...(await scan(`${theme} list`)))
    await nav(page, 'Big-O Blitz')
    found.push(...(await scan(`${theme} bigo`)))
    await nav(page, 'Pattern Match')
    found.push(...(await scan(`${theme} two pointers`)))
  }
  expect(found).toEqual([])
})
const REVCODE = 'next = curr.next'
