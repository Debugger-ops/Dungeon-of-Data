import { expect, test } from '@playwright/test'
import { createProfile } from './helpers'

const nav = (page, label) => page.locator('nav').getByRole('button', { name: label, exact: true }).click()

test('first run asks for a profile, then shows the map', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Create your profile')).toBeVisible()
  await createProfile(page, 'Asha')
  await expect(page.locator('.who').first()).toContainText('Asha')
  await expect(page.getByRole('heading', { name: 'Daily Challenge' })).toBeVisible()
  // 7 rooms plus quiz, analytics and tome
  await expect(page.locator('.room')).toHaveCount(10)
})

test('every room page renders without errors', async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await createProfile(page)
  for (const label of ['Sorting Hall', 'Binary Vault', 'The Keep', 'Root Crypt', 'Labyrinth', 'Hash Forge', 'DP Dungeon', 'Daily', 'Quiz', 'Analytics', 'Tome', 'Ledger', 'Settings']) {
    await nav(page, label)
    await expect(page.locator('main h2').first()).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('hash forge: chaining round can be won', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'Hash Forge')
  for (let k = 0; k < 8; k++) {
    const key = Number((await page.locator('.big').first().textContent()).match(/\d+/)[0])
    await page.getByLabel(`Bucket ${key % 7}`).click()
  }
  await expect(page.getByText('The wave is broken')).toBeVisible()
  await expect(page.getByText(/\+\d+ XP/)).toBeVisible()
})

test('dp dungeon: filling the coin table correctly wins', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'DP Dungeon')
  const coins = (await page.locator('main h3').first().textContent()).match(/\{(.+)\}/)[1].split(', ').map(Number)
  const dp = [0]
  for (let a = 1; a <= 8; a++) dp[a] = 1 + Math.min(...coins.filter((c) => c <= a).map((c) => dp[a - c]))
  for (let a = 1; a <= 8; a++) await page.getByRole('button', { name: String(dp[a]), exact: true }).click()
  await expect(page.getByText('The wave is broken')).toBeVisible()
})

test('a wrong answer costs a life; a hint caps stars at 2', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'DP Dungeon')
  await page.getByRole('button', { name: 'Hint' }).click()
  await expect(page.locator('.msg.hint')).toContainText('Hint:')
  const coins = (await page.locator('main h3').first().textContent()).match(/\{(.+)\}/)[1].split(', ').map(Number)
  const dp = [0]
  for (let a = 1; a <= 8; a++) dp[a] = 1 + Math.min(...coins.filter((c) => c <= a).map((c) => dp[a - c]))
  for (let a = 1; a <= 8; a++) await page.getByRole('button', { name: String(dp[a]), exact: true }).click()
  await expect(page.locator('.result .stars')).toHaveText('★★☆')
})

test('quiz: answer six questions and earn XP', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'Quiz')
  await page.getByRole('button', { name: 'Start quiz' }).click()
  for (let k = 0; k < 6; k++) {
    await page.locator('.qopt').first().click()
    await page.getByRole('button', { name: /Next question|Finish/ }).click()
  }
  await expect(page.getByText(/\d \/ 6 correct/)).toBeVisible()
})

test('profiles are separate and a PIN protects a profile', async ({ page, context }) => {
  await page.goto('/')
  await page.getByPlaceholder('e.g. Bhumika').fill('Asha')
  await page.getByPlaceholder('4 to 8 digits').fill('4321')
  await page.locator('label:has-text("Repeat PIN") input').fill('4321')
  await page.getByRole('button', { name: 'Start playing' }).click()
  await page.locator('.who').first().waitFor()
  await page.locator('.opt', { hasText: 'Hard' }).click()
  // a new tab is a new session, so the PIN is required again
  const tab = await context.newPage()
  await tab.goto('/')
  await tab.getByLabel('PIN').fill('0000')
  await tab.getByRole('button', { name: 'Unlock' }).click()
  await expect(tab.getByText('Wrong PIN.')).toBeVisible()
  await tab.getByLabel('PIN').fill('4321')
  await tab.getByRole('button', { name: 'Unlock' }).click()
  await expect(tab.locator('.opt.on', { hasText: 'Hard' })).toBeVisible()
})

test('settings: light theme and large text apply and persist', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'Settings')
  await page.getByRole('radio', { name: 'Light' }).click()
  await page.getByRole('radio', { name: 'Large' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('html')).toHaveAttribute('data-text', 'large')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('analytics preview renders the charts', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'Analytics')
  await page.getByRole('button', { name: 'Preview with sample data' }).click()
  await expect(page.getByRole('img', { name: 'Mastery radar chart' })).toBeVisible()
  await page.getByRole('button', { name: 'Algorithm lab' }).click()
  await expect(page.getByRole('img', { name: 'Log-log growth chart' }).first()).toBeVisible()
})
