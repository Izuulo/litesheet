import { expect, test } from '@playwright/test'

test('design preview: ticking fills Collected, unticking restores it', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
  page.on('pageerror', (err) => errors.push(err.message))
  await page.goto('./design.html')

  const row = page.getByRole('listitem').filter({ hasText: 'Andesite' })
  const collected = row.getByRole('spinbutton')
  const done = row.getByRole('checkbox')
  await expect(row).toContainText('31 st + 16')
  await expect(row).toContainText('1 SB + 4 st + 16')
  await expect(collected).toHaveValue('575')

  await done.check()
  await expect(collected).toHaveValue('2000')
  await done.uncheck()
  await expect(collected).toHaveValue('575')

  await collected.fill('2000')
  await expect(done).toBeChecked()
  await expect(page.getByText('4 of 15 done')).toBeVisible()
  await collected.fill('575')

  // `pnpm design:shots` saves the screenshots that get committed
  if (process.env.SHOTS) {
    for (const [name, width, height, scheme] of [
      ['tracker-light', 1280, 800, 'light'],
      ['tracker-dark', 1280, 800, 'dark'],
      ['tracker-phone', 390, 844, 'light'],
    ] as const) {
      await page.setViewportSize({ width, height })
      await page.emulateMedia({ colorScheme: scheme })
      await page.screenshot({ path: `design/screenshots/${name}.png` })
    }
  }
  expect(errors).toEqual([])
})
