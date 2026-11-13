import { expect, test } from '@playwright/test'

test('placeholder page loads with no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
  page.on('pageerror', (err) => errors.push(err.message))
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Litesheet' })).toBeVisible()
  expect(errors).toEqual([])
})
