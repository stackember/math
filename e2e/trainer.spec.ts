import { expect, test, type Page } from "@playwright/test"

import { PRACTICE_URLS } from "./content"

/** Еталонний тренажер для перевірки клавіатури й короткої відповіді. */
const REFERENCE = "/numbers/number-sets/practice"

/** Збирає помилки сторінки: гідрація, дві копії React тощо мають валити тест. */
function collectErrors(page: Page) {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  return errors
}

/** Усі локатори — в межах картки тренажера, щоб таблиці чи поля шпаргалки не заважали. */
const card = (page: Page) => page.locator("[data-slot=card]")
/** Пояснення після перевірки (не плутати зі службовим role="alert" від Next). */
const feedback = (page: Page) => card(page).locator("[data-slot=alert]")
const shortInput = (page: Page) => card(page).getByRole("textbox", { name: "Відповідь" })
const button = (page: Page, name: string | RegExp) =>
  card(page).getByRole("button", { name, exact: typeof name === "string" })

/**
 * Відкриває тренажер і повертає кількість завдань.
 * Тренажер вантажиться лише в браузері — чекаємо, доки з'явиться перше завдання.
 */
async function openTrainer(page: Page, url: string) {
  await page.goto(url)
  await expect(card(page)).toContainText(/Завдання 1 \/ \d+/)
  const match = /Завдання 1 \/ (\d+)/.exec(await card(page).innerText())
  if (!match) throw new Error("не знайдено лічильник завдань")
  return Number(match[1])
}

/** Дає будь-яку відповідь на поточне завдання (правильність перевіряють юніт-тести). */
async function answerCurrent(page: Page) {
  const area = card(page).locator('[role=radio], table, input[aria-label="Відповідь"]').first()
  await area.waitFor()

  const tag = await area.evaluate((element) => element.tagName)
  if (tag === "BUTTON") return area.click()
  if (tag === "TABLE") {
    for (const name of ["1 — А", "2 — Б", "3 — В"]) {
      await button(page, name).click()
    }
    return
  }
  await shortInput(page).fill("1")
}

// нова практика потрапляє в повне проходження автоматично
for (const url of PRACTICE_URLS) {
  test(`${url}: повне проходження, пояснення, результат і збережений рекорд`, async ({ page }) => {
    const errors = collectErrors(page)
    const total = await openTrainer(page, url)

    for (let i = 1; i <= total; i++) {
      await expect(card(page)).toContainText(`Завдання ${i} / ${total}`)
      await answerCurrent(page)
      await button(page, "Перевірити").click()
      await expect(feedback(page)).toContainText(/Правильно|Неправильно/)
      await button(page, i === total ? "Результат" : /^Далі/).click()
    }

    await expect(card(page)).toContainText(`/ ${total}`)
    await expect(page.getByRole("list", { name: "Результат за правилами" })).toBeVisible()
    await expect(button(page, "Пройти ще раз")).toBeVisible()

    await page.reload()
    await expect(page.getByText(new RegExp(`Найкращий результат: \\d+/${total}`))).toBeVisible()
    expect(errors).toEqual([])
  })
}

test("клавіатура: цифра обирає варіант, Enter перевіряє і веде далі", async ({ page }) => {
  const total = await openTrainer(page, REFERENCE)

  // перші завдання — легкі, а всі легкі в еталонному тренажері — з вибором відповіді
  await page.keyboard.press("2")
  await expect(card(page).getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true")
  await page.keyboard.press("Enter")
  await expect(feedback(page)).toContainText(/Правильно|Неправильно/)
  await page.keyboard.press("Enter")
  await expect(card(page)).toContainText(`Завдання 2 / ${total}`)
})

test("нечислова коротка відповідь — підказка, а не помилка", async ({ page }) => {
  const total = await openTrainer(page, REFERENCE)

  for (let i = 1; i <= total; i++) {
    await expect(card(page)).toContainText(`Завдання ${i} / ${total}`)
    if (await shortInput(page).count()) break
    await answerCurrent(page)
    await button(page, "Перевірити").click()
    await button(page, /^Далі/).click()
  }

  await shortInput(page).fill("abc")
  await shortInput(page).press("Enter")
  await expect(feedback(page)).toContainText("Введи число")
  await expect(button(page, "Перевірити")).toBeVisible()
})
