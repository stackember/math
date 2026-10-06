import { expect, test, type Page } from "@playwright/test"

import { PRACTICE_SLUGS } from "./content"

/** Еталонний тренажер для перевірки клавіатури й короткої відповіді. */
const REFERENCE = "number-sets"

/** Збирає помилки сторінки: гідрація, дві копії React тощо мають валити тест. */
function collectErrors(page: Page) {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  return errors
}

const card = (page: Page) => page.locator("[data-slot=card]")
/** Пояснення після перевірки (не плутати зі службовим role="alert" від Next). */
const feedback = (page: Page) => page.locator("[data-slot=alert]")
const shortInput = (page: Page) => page.getByRole("textbox", { name: "Відповідь" })

/**
 * Відкриває тренажер і повертає кількість завдань.
 * Тренажер вантажиться лише в браузері — чекаємо, доки з'явиться перше завдання.
 */
async function openTrainer(page: Page, slug: string) {
  await page.goto(`/practice/${slug}`)
  await expect(card(page)).toContainText(/Питання 1 \/ \d+/)
  const match = /Питання 1 \/ (\d+)/.exec(await card(page).innerText())
  if (!match) throw new Error("не знайдено лічильник завдань")
  return Number(match[1])
}

/** Дає будь-яку відповідь на поточне завдання (правильність перевіряють юніт-тести). */
async function answerCurrent(page: Page) {
  const area = page.locator('[role=radio], table, input[aria-label="Відповідь"]').first()
  await area.waitFor()

  const tag = await area.evaluate((element) => element.tagName)
  if (tag === "BUTTON") return area.click()
  if (tag === "TABLE") {
    for (const name of ["1 — А", "2 — Б", "3 — В"]) {
      await page.getByRole("button", { name, exact: true }).click()
    }
    return
  }
  await shortInput(page).fill("1")
}

// нова практика потрапляє в повне проходження автоматично
for (const slug of PRACTICE_SLUGS) {
  test(`${slug}: повне проходження, пояснення, результат і збережений рекорд`, async ({ page }) => {
    const errors = collectErrors(page)
    const total = await openTrainer(page, slug)

    for (let i = 1; i <= total; i++) {
      await expect(card(page)).toContainText(`Питання ${i} / ${total}`)
      await answerCurrent(page)
      await page.getByRole("button", { name: "Перевірити" }).click()
      await expect(feedback(page)).toContainText(/Правильно|Неправильно/)
      await page.getByRole("button", { name: i === total ? "Результат" : /^Далі/ }).click()
    }

    await expect(card(page)).toContainText(`/ ${total}`)
    await expect(page.getByRole("list", { name: "Результат за правилами" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Пройти ще раз" })).toBeVisible()

    await page.reload()
    await expect(page.getByText(new RegExp(`Найкращий результат: \\d+/${total}`))).toBeVisible()
    expect(errors).toEqual([])
  })
}

test("клавіатура: цифра обирає варіант, Enter перевіряє і веде далі", async ({ page }) => {
  const total = await openTrainer(page, REFERENCE)

  // перші завдання — легкі, а всі легкі в еталонному тренажері — з вибором відповіді
  await page.keyboard.press("2")
  await expect(page.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true")
  await page.keyboard.press("Enter")
  await expect(feedback(page)).toContainText(/Правильно|Неправильно/)
  await page.keyboard.press("Enter")
  await expect(card(page)).toContainText(`Питання 2 / ${total}`)
})

test("нечислова коротка відповідь — підказка, а не помилка", async ({ page }) => {
  const total = await openTrainer(page, REFERENCE)

  for (let i = 1; i <= total; i++) {
    await expect(card(page)).toContainText(`Питання ${i} / ${total}`)
    if (await shortInput(page).count()) break
    await answerCurrent(page)
    await page.getByRole("button", { name: "Перевірити" }).click()
    await page.getByRole("button", { name: /^Далі/ }).click()
  }

  await shortInput(page).fill("abc")
  await shortInput(page).press("Enter")
  await expect(feedback(page)).toContainText("Введи число")
  await expect(page.getByRole("button", { name: "Перевірити" })).toBeVisible()
})
