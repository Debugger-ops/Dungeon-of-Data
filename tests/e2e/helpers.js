export async function createProfile(page, name = 'Tester') {
  await page.addInitScript(() => { try { localStorage.setItem('dungeon-of-data-tutorial-v1', '1') } catch (e) { /* ignore */ } })
  await page.goto('/')
  await page.getByPlaceholder('e.g. Bhumika').fill(name)
  await page.getByRole('button', { name: 'Start playing' }).click()
  await page.locator('.who').first().waitFor()
}
