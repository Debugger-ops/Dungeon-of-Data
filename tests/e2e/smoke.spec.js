import { expect, test } from '@playwright/test'
import { createProfile } from './helpers'
import { SNIPPETS } from '../../src/lib/snippets.js'
import { CHALLENGES } from '../../src/lib/challenges.js'
import { prepare } from '../../src/lib/typing.js'

const nav = (page, label) => page.locator('nav').getByRole('button', { name: label, exact: true }).click()

test('first run asks for a profile, then shows the map', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Create your profile')).toBeVisible()
  await createProfile(page, 'Asha')
  await expect(page.locator('.who').first()).toContainText('Asha')
  await expect(page.getByRole('heading', { name: 'Daily Challenge' })).toBeVisible()
  // 8 rooms plus quiz, analytics and tome
  await expect(page.locator('.room')).toHaveCount(25)
})

test('every room page renders without errors', async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await createProfile(page)
  for (const label of ['Sorting Hall', 'Binary Vault', 'The Keep', 'Root Crypt', 'Labyrinth', 'Hash Forge', 'DP Dungeon', 'Scribe Tower', 'Linked List Lab', 'Bit Bunker', 'Big-O Blitz', 'Pattern Match', 'Memory Match', 'Stack Defender', 'Bug Hunt', 'Graph Builder', 'Trie Tunnel', 'Union Yard', 'Backtrack Bastion', 'Heap Hollow', 'Campaign', 'Daily', 'Boss Rush', 'Leaderboard', 'Quiz', 'Review', 'Interview', 'Visualizer', 'Cheat sheet', 'Shop', 'Weekly', 'Challenge', 'Endless', 'Speedrun', 'Sorting Race', 'Analytics', 'Tome', 'Ledger', 'Settings']) {
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
  await context.addInitScript(() => { try { localStorage.setItem('dungeon-of-data-tutorial-v1', '1') } catch (e) { /* ignore */ } })
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

test('scribe tower: typing a snippet end to end wins; a wrong key is counted', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'Scribe Tower')
  await page.getByTestId('codebox').click()
  await page.keyboard.type('~')
  await expect(page.getByTestId('errors')).toHaveText('1')
  const lines = prepare(SNIPPETS[0].js)
  for (let i = 0; i < lines.length; i++) {
    await page.keyboard.type(lines[i].text)
    if (i < lines.length - 1) await page.keyboard.press('Enter')
  }
  await expect(page.getByText('The wave is broken')).toBeVisible()
  await expect(page.getByText(/WPM/).first()).toBeVisible()
})

test('scribe tower: too many typing slips lose the round', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'Scribe Tower')
  await page.getByTestId('codebox').click()
  await page.keyboard.type('~'.repeat(30))
  await expect(page.getByText('The keep has fallen')).toBeVisible()
})

test('scribe tower: writing the right function passes the tests and wins', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'Scribe Tower')
  await page.getByRole('button', { name: 'Write the code' }).click()
  await page.getByRole('button', { name: 'Run tests' }).click()
  await expect(page.getByTestId('tests').locator('li.fail').first()).toBeVisible()
  await page.getByLabel('Code editor').fill(CHALLENGES[0].solution)
  await page.getByRole('button', { name: 'Run tests' }).click()
  await expect(page.getByText('The wave is broken')).toBeVisible()
})

test('scribe tower: an infinite loop times out instead of freezing the page', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'Scribe Tower')
  await page.getByRole('button', { name: 'Write the code' }).click()
  await page.getByLabel('Code editor').fill('function binarySearch(a, key) { while (true) {} }')
  await page.getByRole('button', { name: 'Run tests' }).click()
  await expect(page.getByText(/Timed out/)).toBeVisible({ timeout: 8000 })
  await expect(page.getByRole('button', { name: 'Run tests' })).toBeEnabled()
})

test('without a backend the leaderboard and cloud card explain how to enable it', async ({ page }) => {
  await createProfile(page)
  await nav(page, 'Leaderboard')
  await expect(page.getByText('Online features are not set up on this copy')).toBeVisible()
  await page.locator('.who').first().click()
  await expect(page.getByText(/Not set up on this copy/)).toBeVisible()
})

test('winning a round offers Share result, which copies the text', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await createProfile(page)
  await nav(page, 'Hash Forge')
  for (let k = 0; k < 8; k++) {
    const key = Number((await page.locator('.big').first().textContent()).match(/\d+/)[0])
    await page.getByLabel(`Bucket ${key % 7}`).click()
  }
  await page.getByRole('button', { name: 'Share result' }).click()
  await expect(page.getByText('Copied to clipboard')).toBeVisible()
  const text = await page.evaluate(() => navigator.clipboard.readText())
  expect(text).toMatch(/^Dungeon of Data: Hash Forge [★☆]{3} \| \+\d+ XP/)
})

test('keyboard users get a skip link and focus moves to the new page', async ({ page }) => {
  await createProfile(page)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await nav(page, 'Quiz')
  await expect(page.locator('#main')).toBeFocused()
  await expect(page).toHaveTitle(/Quiz \| Dungeon of Data/)
  await expect(page.locator('nav button[aria-current="page"]')).toHaveText('Quiz')
})
