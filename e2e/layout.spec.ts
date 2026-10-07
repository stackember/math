import { expect, test } from "@playwright/test"

import { CONTENT_URLS, EXTRA_URLS, TRAINER_URLS } from "./content"

for (const path of [...CONTENT_URLS, ...EXTRA_URLS]) {
  test(`${path}: без горизонтальної прокрутки`, async ({ page }) => {
    await page.goto(path)
    // тренажер вантажиться лише в браузері — міряємо після того, як він з'явився
    if (TRAINER_URLS.includes(path)) await page.locator("[data-slot=card]").waitFor()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test("десктоп: контент не прилипає до змісту справа", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "зміст справа є лише на широкому екрані")
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/numbers/number-sets")

  const content = await page.locator("#nd-page .prose").boundingBox()
  const toc = await page.locator("#nd-toc").boundingBox()
  if (!content || !toc) throw new Error("не знайдено текст сторінки або зміст справа")

  expect(toc.x - (content.x + content.width)).toBeGreaterThanOrEqual(24)
  expect(toc.width).toBeLessThanOrEqual(320)
})
