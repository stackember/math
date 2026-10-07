import { expect, test } from "@playwright/test"

import { CONTENT_URLS, EXTRA_URLS, NUMBERS_ORDER, SUBJECT, topicTitle } from "./content"

// нові теми й практики потрапляють у цю перевірку самі
for (const url of [...CONTENT_URLS, ...EXTRA_URLS]) {
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

/** Пункти меню зверху вниз: теми з практикою — кнопки, що розгортають, решта — посилання. */
const sidebarLabels = (page: import("@playwright/test").Page) =>
  page
    .locator("#nd-sidebar a, #nd-sidebar button")
    .evaluateAll((items) => items.map((item) => item.textContent?.trim() ?? ""))

test("меню: теми в порядку meta.json розділу", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "на телефоні меню сховане в шухляді")
  await page.goto("/")
  await expect(page).toHaveTitle("Теорія і практика")

  // меню предмета — на його сторінках
  await page.goto(`/${SUBJECT}`)
  const labels = await sidebarLabels(page)
  const positions = NUMBERS_ORDER.map((slug) =>
    labels.indexOf(topicTitle(SUBJECT, "numbers", slug))
  )
  expect(positions.every((p) => p >= 0)).toBe(true)
  expect([...positions].sort((a, b) => a - b)).toEqual(positions)

  // змішаний тест і прогрес — у кінці меню, після всіх тем (далі лише перемикач теми)
  const extra = ["Змішаний тест", "Прогрес"].map((label) => labels.indexOf(label))
  expect(extra[0]).toBeGreaterThan(Math.max(...positions))
  expect(extra[1]).toBe(extra[0] + 1)
})

test("меню: тема з практикою розгортається в «Теорія» і «Практика»", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "на телефоні меню сховане в шухляді")
  await page.goto(`/${SUBJECT}/numbers/number-sets`)

  const sidebar = page.locator("#nd-sidebar")
  // назва теми — кнопка, що розгортає, а не посилання на теорію
  await expect(sidebar.getByRole("button", { name: "Числові множини" })).toBeVisible()
  await expect(sidebar.locator(`a[href="/${SUBJECT}/numbers/number-sets"]`)).toHaveText("Теорія")
  await expect(sidebar.locator(`a[href="/${SUBJECT}/numbers/number-sets/practice"]`)).toHaveText(
    "Практика"
  )

  const labels = await sidebarLabels(page)
  const topic = labels.indexOf("Числові множини")
  expect(labels.slice(topic, topic + 3)).toEqual(["Числові множини", "Теорія", "Практика"])

  // згорнута тема ховає свої сторінки, а поточна — розгорнута сама
  await page.goto(`/${SUBJECT}/numbers/modulus`)
  await expect(sidebar.locator(`a[href="/${SUBJECT}/numbers/number-sets/practice"]`)).toHaveCount(0)
})

test("футер «‹ ›» показує повні назви сусідніх сторінок, а не «Теорія»", async ({ page }) => {
  await page.goto(`/${SUBJECT}/numbers/number-sets`)
  const footer = page.locator("#nd-page").getByRole("link", { name: /Практика: числові множини/ })
  await expect(footer).toHaveAttribute("href", `/${SUBJECT}/numbers/number-sets/practice`)

  await page.goto(`/${SUBJECT}/numbers/number-sets/practice`)
  await expect(
    page.locator("#nd-page").getByRole("link", { name: /^Числові множини/ })
  ).toHaveAttribute("href", `/${SUBJECT}/numbers/number-sets`)
})

test("теорія: формули без помилок і перехід до практики", async ({ page }) => {
  await page.goto(`/${SUBJECT}/numbers/number-sets`)
  await expect(page.getByRole("heading", { level: 1, name: "Числові множини" })).toBeVisible()
  expect(await page.locator(".katex").count()).toBeGreaterThan(50)
  await expect(page.locator(".katex-error")).toHaveCount(0)

  await page.locator("#nd-page").getByRole("link", { name: "Практика", exact: true }).click()
  await expect(page).toHaveURL(`/${SUBJECT}/numbers/number-sets/practice`)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Практика: числові множини")
  await expect(
    page.locator("#nd-page").getByRole("link", { name: "Теорія", exact: true })
  ).toBeVisible()
})

test("тема без практики не має кнопки «Практика»", async ({ page }) => {
  await page.goto(`/${SUBJECT}/numbers/modulus`)
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
  expect(
    results.map((r) => r.url).some((url) => url.startsWith(`/${SUBJECT}/numbers/integers`))
  ).toBe(true)
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
  const response = await page.goto(`/${SUBJECT}/numbers/does-not-exist`)
  expect(response?.status()).toBe(404)
  await expect(page.getByRole("heading", { name: "Сторінку не знайдено" })).toBeVisible()
})
