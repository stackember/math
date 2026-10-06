import { expect, test, type Page } from "@playwright/test"

const URL = "/practice/number-sets"

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

/** Тренажер вантажиться лише в браузері — чекаємо, доки з'явиться завдання. */
async function openTrainer(page: Page) {
  await page.goto(URL)
  await expect(card(page)).toContainText("Питання 1 / 13")
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

test("повне проходження: пояснення, результат і збережений рекорд", async ({ page }) => {
  const errors = collectErrors(page)
  await openTrainer(page)

  for (let i = 1; i <= 13; i++) {
    await expect(card(page)).toContainText(`Питання ${i} / 13`)
    await answerCurrent(page)
    await page.getByRole("button", { name: "Перевірити" }).click()
    await expect(feedback(page)).toContainText(/Правильно|Неправильно/)
    await page.getByRole("button", { name: i === 13 ? "Результат" : /^Далі/ }).click()
  }

  await expect(card(page)).toContainText("/ 13")
  await expect(page.getByRole("list", { name: "Результат за правилами" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Пройти ще раз" })).toBeVisible()

  await page.reload()
  await expect(page.getByText(/Найкращий результат: \d+\/13/)).toBeVisible()
  expect(errors).toEqual([])
})

test("клавіатура: цифра обирає варіант, Enter перевіряє і веде далі", async ({ page }) => {
  await openTrainer(page)

  // перші завдання — легкі, а всі легкі тут з вибором відповіді
  await page.keyboard.press("2")
  await expect(page.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true")
  await page.keyboard.press("Enter")
  await expect(feedback(page)).toContainText(/Правильно|Неправильно/)
  await page.keyboard.press("Enter")
  await expect(card(page)).toContainText("Питання 2 / 13")
})

test("нечислова коротка відповідь — підказка, а не помилка", async ({ page }) => {
  await openTrainer(page)

  for (let i = 1; i <= 13; i++) {
    await expect(card(page)).toContainText(`Питання ${i} / 13`)
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
