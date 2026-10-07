import { expect, test } from "@playwright/test"

import { CONTENT_URLS, NUMBERS_ORDER } from "./content"

// нові теми й практики потрапляють у цю перевірку самі
for (const url of CONTENT_URLS) {
  test(`${url}: сторінка відкривається без помилок`, async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })

    const response = await page.goto(url)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await page.waitForLoadState("networkidle")
    await expect(page.locator(".katex-error")).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

const sidebarHrefs = (page: import("@playwright/test").Page) =>
  page.locator("#nd-sidebar a").evaluateAll((links) => links.map((a) => a.getAttribute("href")))

test("меню: теми в порядку meta.json розділу", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "на телефоні меню сховане в шухляді")
  await page.goto("/")
  await expect(page).toHaveTitle("Математика · НМТ")

  const hrefs = await sidebarHrefs(page)
  const positions = NUMBERS_ORDER.map((slug) => hrefs.indexOf(`/numbers/${slug}`))
  expect(positions.every((p) => p >= 0)).toBe(true)
  expect([...positions].sort((a, b) => a - b)).toEqual(positions)
})

test("меню: практика — пункт «Практика» одразу під своєю темою", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "на телефоні меню сховане в шухляді")
  await page.goto("/numbers/number-sets")

  const hrefs = await sidebarHrefs(page)
  const theory = hrefs.indexOf("/numbers/number-sets")
  expect(hrefs[theory + 1]).toBe("/numbers/number-sets/practice")
  await expect(page.locator('#nd-sidebar a[href="/numbers/number-sets/practice"]')).toHaveText(
    "Практика"
  )
})

test("теорія: формули без помилок і перехід до практики", async ({ page }) => {
  await page.goto("/numbers/number-sets")
  await expect(page.getByRole("heading", { level: 1, name: "Числові множини" })).toBeVisible()
  expect(await page.locator(".katex").count()).toBeGreaterThan(50)
  await expect(page.locator(".katex-error")).toHaveCount(0)

  await page.locator("#nd-page").getByRole("link", { name: "Практика", exact: true }).click()
  await expect(page).toHaveURL("/numbers/number-sets/practice")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Практика: числові множини")
  await expect(
    page.locator("#nd-page").getByRole("link", { name: "Теорія", exact: true })
  ).toBeVisible()
})

test("тема без практики не має кнопки «Практика»", async ({ page }) => {
  await page.goto("/numbers/modulus")
  await expect(page.getByRole("heading", { level: 1, name: "Модуль числа" })).toBeVisible()
  await expect(
    page.locator("#nd-page").getByRole("link", { name: "Практика", exact: true })
  ).toHaveCount(0)
})

test("пошук українською з читабельними формулами", async ({ page, request }) => {
  const results = (await (await request.get("/api/search?query=остача")).json()) as {
    url: string
    content: string
  }[]
  expect(results.map((r) => r.url).some((url) => url.startsWith("/numbers/integers"))).toBe(true)
  expect(results.some((r) => r.content.includes("5 · (−4)"))).toBe(true)
  expect(results.some((r) => r.content.includes("\\cdot"))).toBe(false)

  await page.goto("/")
  const dialog = page.getByRole("dialog")
  // клік до гідрації React нічого не відкриває — повторюємо, доки діалог не з'явиться
  await expect(async () => {
    await page.getByRole("button", { name: "Пошук" }).first().click()
    await expect(dialog).toBeVisible({ timeout: 1_000 })
  }).toPass()
  await dialog.getByRole("combobox", { name: "Пошук" }).fill("модуль")
  await expect(dialog.getByText("Модуль числа").first()).toBeVisible()
})

test("неіснуюча сторінка — 404 українською", async ({ page }) => {
  const response = await page.goto("/numbers/does-not-exist")
  expect(response?.status()).toBe(404)
  await expect(page.getByRole("heading", { name: "Сторінку не знайдено" })).toBeVisible()
})
