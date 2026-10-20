export async function createProfile(page, name = 'Tester') {
  await page.goto('/')
  await page.getByPlaceholder('e.g. Bhumika').fill(name)
  await page.getByRole('button', { name: 'Start playing' }).click()
  await page.locator('.who').first().waitFor()
}
