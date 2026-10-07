import { expect, test, type Page } from "@playwright/test"

import { PRACTICE_URLS, practiceQuestions, type PracticeQuestion } from "./content"

/** Еталонний тренажер для перевірки клавіатури, повторення помилок і короткої відповіді. */
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
/** Заголовок пояснення: «Правильно» або «Неправильно. Відповідь: …». */
const verdict = (page: Page) => card(page).locator("[data-slot=alert-title]")
const shortInput = (page: Page) => card(page).getByRole("textbox", { name: "Відповідь" })
const button = (page: Page, name: string | RegExp) =>
  card(page).getByRole("button", { name, exact: typeof name === "string" })
/** Варіант за індексом із frontmatter (`data-option`), у відповідності — ще й рядок (`data-row`). */
const option = (page: Page, index: number, row?: number) =>
  card(page).locator(
    row === undefined ? `[data-option="${index}"]` : `[data-row="${row}"] [data-option="${index}"]`
  )

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

/** Поточне завдання: `data-question` картки — індекс у frontmatter. */
async function currentQuestion(page: Page, questions: PracticeQuestion[]) {
  const id = await card(page).getAttribute("data-question")
  const question = questions[Number(id)]
  if (!question) throw new Error(`невідоме завдання ${id}`)
  return question
}

/** Правильна відповідь із frontmatter. */
async function answerCorrectly(page: Page, question: PracticeQuestion) {
  if (question.type === "choice") await option(page, question.answer).click()
  else if (question.type === "match") {
    for (const [row, column] of question.answer.entries()) await option(page, column, row).click()
  } else await shortInput(page).fill(String(question.answer))
}

/** Свідомо неправильна: сусідній варіант, зсунуті пари (відповіді різні, тож усі рядки хибні), інше число. */
async function answerWrongly(page: Page, question: PracticeQuestion) {
  if (question.type === "choice") await option(page, (question.answer + 1) % 5).click()
  else if (question.type === "match") {
    const { answer } = question
    for (const [row] of answer.entries())
      await option(page, answer[(row + 1) % answer.length], row).click()
  } else await shortInput(page).fill(String(question.answer + 1))
}

// нова практика потрапляє в повне проходження автоматично
for (const url of PRACTICE_URLS) {
  const questions = practiceQuestions(url)

  test(`${url}: правильні відповіді на всі завдання, результат і збережений рекорд`, async ({
    page,
  }) => {
    const errors = collectErrors(page)
    const total = await openTrainer(page, url)
    expect(total).toBe(questions.length)

    for (let i = 1; i <= total; i++) {
      await expect(card(page)).toContainText(`Завдання ${i} / ${total}`)
      await answerCorrectly(page, await currentQuestion(page, questions))
      await button(page, "Перевірити").click()
      await expect(verdict(page)).toHaveText("Правильно")
      await button(page, i === total ? "Результат" : /^Далі/).click()
    }

    await expect(card(page)).toContainText(`${total} / ${total}`)
    await expect(card(page)).toContainText("Ідеально")
    await expect(page.getByRole("list", { name: "Результат за правилами" })).toBeVisible()
    await expect(button(page, /^Повторити помилки/)).toHaveCount(0)
    await expect(button(page, "Пройти ще раз")).toBeVisible()

    await page.reload()
    await expect(
      page.getByText(`Найкращий результат: ${total}/${total} · останній: ${total}/${total}`)
    ).toBeVisible()
    expect(errors).toEqual([])
  })
}

test("повторення помилок: лише неправильні завдання, рекорд не змінюється", async ({ page }) => {
  const questions = practiceQuestions(REFERENCE)
  const total = await openTrainer(page, REFERENCE)

  for (let i = 1; i <= total; i++) {
    await expect(card(page)).toContainText(`Завдання ${i} / ${total}`)
    const question = await currentQuestion(page, questions)
    await (i === 1 ? answerWrongly : answerCorrectly)(page, question)
    await button(page, "Перевірити").click()
    await expect(verdict(page)).toContainText(i === 1 ? "Неправильно" : "Правильно")
    await button(page, i === total ? "Результат" : /^Далі/).click()
  }
  await expect(card(page)).toContainText(`${total - 1} / ${total}`)

  await button(page, "Повторити помилки (1)").click()
  await expect(card(page)).toContainText("Повторення помилок 1 / 1")
  await answerCorrectly(page, await currentQuestion(page, questions))
  await button(page, "Перевірити").click()
  await expect(verdict(page)).toHaveText("Правильно")
  await button(page, "Результат").click()
  await expect(card(page)).toContainText("1 / 1")
  await expect(button(page, /^Повторити помилки/)).toHaveCount(0)

  // повторення не записується: рекорд і останній результат — від повного проходу
  await expect(
    page.getByText(`Найкращий результат: ${total - 1}/${total} · останній: ${total - 1}/${total}`)
  ).toBeVisible()
})

test("клавіатура: цифра обирає варіант, Enter перевіряє і веде далі", async ({ page }) => {
  const total = await openTrainer(page, REFERENCE)

  // перші завдання — легкі, а всі легкі в еталонному тренажері — з вибором відповіді
  await page.keyboard.press("2")
  await expect(card(page).getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true")
  await page.keyboard.press("Enter")
  await expect(verdict(page)).toBeVisible()
  await page.keyboard.press("Enter")
  await expect(card(page)).toContainText(`Завдання 2 / ${total}`)
})

test("нечислова коротка відповідь — підказка, а не помилка", async ({ page }) => {
  const questions = practiceQuestions(REFERENCE)
  const total = await openTrainer(page, REFERENCE)

  for (let i = 1; i <= total; i++) {
    await expect(card(page)).toContainText(`Завдання ${i} / ${total}`)
    const question = await currentQuestion(page, questions)
    if (question.type === "short") break
    await answerCorrectly(page, question)
    await button(page, "Перевірити").click()
    await button(page, /^Далі/).click()
  }

  await shortInput(page).fill("abc")
  await shortInput(page).press("Enter")
  await expect(card(page).locator("[data-slot=alert]")).toContainText("Введи число")
  await expect(button(page, "Перевірити")).toBeVisible()
})
