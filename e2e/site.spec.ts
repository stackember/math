import { expect, test } from "@playwright/test"

import { CONTENT_URLS } from "./content"

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

test("головна: меню теорії й практики в порядку тем", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle("Математика · НМТ")

  const links = await page.locator("#nd-sidebar a").allTextContents()
  const order = ["Числові множини", "Модуль числа", "Дії з цілими числами", "Подільність"]
  const positions = order.map((name) => links.indexOf(name))
  expect(positions.every((p) => p >= 0)).toBe(true)
  expect([...positions].sort((a, b) => a - b)).toEqual(positions)
})

test("теорія: формули без помилок і перехід до практики", async ({ page }) => {
  await page.goto("/theory/number-sets")
  await expect(page.getByRole("heading", { level: 1, name: "Числові множини" })).toBeVisible()
  expect(await page.locator(".katex").count()).toBeGreaterThan(50)
  await expect(page.locator(".katex-error")).toHaveCount(0)

  await page.locator("#nd-page").getByRole("link", { name: "Практика", exact: true }).click()
  await expect(page).toHaveURL("/practice/number-sets")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Практика: числові множини")
  await expect(
    page.locator("#nd-page").getByRole("link", { name: "Теорія", exact: true })
  ).toBeVisible()
})

test("тема без практики не має кнопки «Практика»", async ({ page }) => {
  await page.goto("/theory/modulus")
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
  expect(results.map((r) => r.url).some((url) => url.startsWith("/theory/integers"))).toBe(true)
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
  const response = await page.goto("/theory/does-not-exist")
  expect(response?.status()).toBe(404)
  await expect(page.getByRole("heading", { name: "Сторінку не знайдено" })).toBeVisible()
})
