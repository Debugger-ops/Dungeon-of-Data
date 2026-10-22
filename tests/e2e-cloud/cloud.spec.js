import { expect, test } from '@playwright/test'
import { createProfile } from '../e2e/helpers'
import { install, newDb } from './fakeSupabase'

const nav = (page, label) => page.locator('nav').getByRole('button', { name: label, exact: true }).click()
const winHash = async (page) => {
  await nav(page, 'Hash Forge')
  for (let k = 0; k < 8; k++) {
    const key = Number((await page.locator('.big').first().textContent()).match(/\d+/)[0])
    await page.getByLabel(`Bucket ${key % 7}`).click()
  }
  await expect(page.getByText('The wave is broken')).toBeVisible()
  await page.getByRole('button', { name: 'Back to map' }).click()
}
const signUpAndLink = async (page, email) => {
  await page.locator('.who').first().click()
  await page.getByRole('button', { name: 'Create account' }).first().click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('correct horse battery')
  await page.getByRole('button', { name: 'Create account' }).last().click()
  await expect(page.getByText(email)).toBeVisible()
  await page.getByRole('button', { name: /^Link / }).click()
  await expect(page.getByTestId('sync-status')).toContainText('Synced', { timeout: 10000 })
}
const xpOf = async (page) => Number((await page.locator('.rank .rt span').textContent()).match(/^(\d+)/)[1])

test('sign up, link, sync, leaderboard, hide, second device, delete', async ({ browser }) => {
  test.setTimeout(60000)
  const db = newDb()
  const ctxA = await browser.newContext()
  await install(ctxA, db)
  const a = await ctxA.newPage()
  const errors = []
  a.on('pageerror', (e) => errors.push(e.message))
  await createProfile(a, 'Asha')
  await signUpAndLink(a, 'asha@example.com')
  expect(db.tables.saves).toHaveLength(1)
  expect(db.tables.leaderboard[0]).toMatchObject({ name: 'Asha', xp: 0, public: true })

  // progress made after linking is pushed automatically
  await winHash(a)
  const xp = await xpOf(a)
  expect(xp).toBeGreaterThan(0)
  await expect.poll(() => db.tables.leaderboard[0].xp, { timeout: 10000 }).toBe(xp)
  expect(db.tables.saves[0].data.xp).toBe(xp)

  // leaderboard shows the player, highlighted
  await nav(a, 'Leaderboard')
  await expect(a.getByRole('row', { name: new RegExp(`Asha \\(you\\).*${xp}`) })).toBeVisible()

  // hiding removes the row for everyone
  await a.locator('.who').first().click()
  await a.getByLabel(/Show me on the public leaderboard/).uncheck()
  await expect.poll(() => db.tables.leaderboard[0].public).toBe(false)
  await nav(a, 'Leaderboard')
  await expect(a.getByText('Nobody is on this board yet')).toBeVisible()

  // a second device signs in and gets the cloud progress merged in
  const ctxB = await browser.newContext()
  await install(ctxB, db)
  const b = await ctxB.newPage()
  await createProfile(b, 'Asha phone')
  expect(await xpOf(b)).toBe(0)
  await b.locator('.who').first().click()
  await b.getByLabel('Email').fill('asha@example.com')
  await b.getByLabel('Password').fill('correct horse battery')
  await b.getByRole('button', { name: 'Sign in', exact: true }).last().click()
  await b.getByRole('button', { name: /^Link / }).click()
  await expect(b.getByTestId('sync-status')).toContainText('Synced', { timeout: 10000 })
  await expect.poll(() => xpOf(b)).toBe(xp)

  // wrong password is reported
  const ctxC = await browser.newContext()
  await install(ctxC, db)
  const c = await ctxC.newPage()
  await createProfile(c, 'Guest')
  await c.locator('.who').first().click()
  await c.getByLabel('Email').fill('asha@example.com')
  await c.getByLabel('Password').fill('wrong password')
  await c.getByRole('button', { name: 'Sign in', exact: true }).last().click()
  await expect(c.getByText('Wrong email or password.')).toBeVisible()

  // deleting cloud data wipes the tables but keeps local progress
  await a.locator('.who').first().click()
  await a.getByRole('button', { name: 'Delete my cloud data' }).click()
  await a.getByRole('button', { name: 'Yes, delete' }).click()
  await expect.poll(() => db.tables.saves.length + db.tables.leaderboard.length).toBe(0)
  expect(await xpOf(a)).toBe(xp)
  expect(errors).toEqual([])
  await ctxA.close(); await ctxB.close(); await ctxC.close()
})

test('backend errors do not break the game', async ({ page, context }) => {
  const db = newDb()
  await install(context, db)
  await createProfile(page, 'Ravi')
  await signUpAndLink(page, 'ravi@example.com')
  await context.route('http://127.0.0.1:54321/rest/**', (r) => r.fulfill({ status: 500, headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ message: 'database down' }) }))
  await page.getByRole('button', { name: 'Sync now' }).click()
  await expect(page.getByTestId('sync-status')).toContainText('database down')
  await winHash(page)
  expect(await xpOf(page)).toBeGreaterThan(0)
})
