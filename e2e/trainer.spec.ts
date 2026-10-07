import { expect, test, type Page } from "@playwright/test"

import type { Question } from "@/features/trainer/model/question/registry"

import { answerer, card, option, shortInput } from "./answers"
import {
  PRACTICE_URL_BY_SLUG,
  PRACTICE_URLS,
  practiceQuestions,
  REFERENCE_PRACTICE_URLS,
  topicTitle,
} from "./content"

/** Еталонний тренажер для перевірки клавіатури, повторення помилок і окремих типів. */
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

/** Заголовок пояснення: «Правильно» або «Неправильно. Відповідь: …». */
const verdict = (page: Page) => card(page).locator("[data-slot=alert-title]")
const button = (page: Page, name: string | RegExp) =>
  card(page).getByRole("button", { name, exact: typeof name === "string" })

/**
 * Відкриває тренажер і повертає кількість завдань.
 * Тренажер вантажиться лише в браузері — чекаємо, доки з'явиться перше завдання.
 */
async function openTrainer(page: Page, url: string) {
  await page.goto(url)
  // перша поява картки — після гідрації; під навантаженням паралельних воркерів це довше за 5 с
  await expect(card(page)).toContainText(/Завдання 1 \/ \d+/, { timeout: 20_000 })
  const match = /Завдання 1 \/ (\d+)/.exec(await card(page).innerText())
  if (!match) throw new Error("не знайдено лічильник завдань")
  return Number(match[1])
}

/** Поточне завдання: `data-question` картки — індекс у frontmatter. */
async function currentQuestion(page: Page, url: string) {
  const id = await card(page).getAttribute("data-question")
  const question = practiceQuestions(url)[Number(id)]
  if (!question) throw new Error(`невідоме завдання ${id}`)
  return question
}

/** Доходить до першого завдання, що підходить, відповідаючи правильно на попередні. */
async function reach(page: Page, url: string, fits: (question: Question) => boolean, what: string) {
  const total = await openTrainer(page, url)
  for (let i = 1; i <= total; i++) {
    const question = await currentQuestion(page, url)
    if (fits(question)) return question
    await answerer(question).correct(page, question)
    await button(page, "Перевірити").click()
    await button(page, /^Далі/).click()
  }
  throw new Error(`у ${url} немає завдання: ${what}`)
}
const reachType = (page: Page, url: string, type: string) =>
  reach(page, url, (q) => q.type === type, `тип ${type}`)

// нова практика потрапляє в повне проходження автоматично: локально — еталонні, у CI — усі
const FULL_RUN = process.env.CI ? PRACTICE_URLS : REFERENCE_PRACTICE_URLS

for (const url of FULL_RUN) {
  test(`${url}: правильні відповіді на всі завдання, результат і збережений рекорд`, async ({
    page,
  }) => {
    const errors = collectErrors(page)
    const total = await openTrainer(page, url)
    expect(total).toBe(practiceQuestions(url).length)

    for (let i = 1; i <= total; i++) {
      await expect(card(page)).toContainText(`Завдання ${i} / ${total}`)
      const question = await currentQuestion(page, url)
      await answerer(question).correct(page, question)
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

    // сторінка прогресу бачить той самий запис: тема, результат, правила
    const [area, slug] = url.split("/").filter(Boolean)
    await page.goto("/progress")
    const topic = page.locator(`[data-topic="${slug}"]`)
    await expect(topic.getByRole("link", { name: topicTitle(area, slug) })).toBeVisible()
    await expect(topic).toContainText(`Найкращий результат: ${total}/${total}`)
    await expect(topic).toContainText("проходів: 1")
    await expect(topic.getByRole("list")).toBeVisible()
    expect(errors).toEqual([])
  })
}

test("змішаний тест: завдання з практик, результат і власний рекорд", async ({ page }) => {
  const errors = collectErrors(page)
  const total = await openTrainer(page, "/test")
  expect(total).toBeGreaterThan(0)
  await expect(card(page).getByRole("button", { name: "Інший набір" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Інший набір" })).toBeVisible()

  for (let i = 1; i <= total; i++) {
    await expect(card(page)).toContainText(`Завдання ${i} / ${total}`)
    const slug = await card(page).getAttribute("data-topic")
    const id = await card(page).getAttribute("data-question")
    const question = practiceQuestions(PRACTICE_URL_BY_SLUG[slug ?? ""])[Number(id)]
    if (!question) throw new Error(`невідоме завдання ${slug}/${id}`)
    await answerer(question).correct(page, question)
    await button(page, "Перевірити").click()
    await expect(verdict(page)).toHaveText("Правильно")
    await button(page, i === total ? "Результат" : /^Далі/).click()
  }
  await expect(card(page)).toContainText(`${total} / ${total}`)
  // правила підписані темою
  await expect(page.getByRole("list", { name: "Результат за правилами" })).toContainText(":")

  await page.reload()
  await expect(
    page.getByText(`Найкращий результат: ${total}/${total} · останній: ${total}/${total}`)
  ).toBeVisible()
  await page.goto("/progress")
  await expect(page.getByText(`Змішаний тест — найкращий: ${total}/${total}`)).toBeVisible()
  expect(errors).toEqual([])
})

test("повторення помилок: лише неправильні завдання, рекорд не змінюється", async ({ page }) => {
  const total = await openTrainer(page, REFERENCE)

  for (let i = 1; i <= total; i++) {
    await expect(card(page)).toContainText(`Завдання ${i} / ${total}`)
    const question = await currentQuestion(page, REFERENCE)
    await (i === 1 ? answerer(question).wrong : answerer(question).correct)(page, question)
    await button(page, "Перевірити").click()
    await expect(verdict(page)).toContainText(i === 1 ? "Неправильно" : "Правильно")
    await button(page, i === total ? "Результат" : /^Далі/).click()
  }
  await expect(card(page)).toContainText(`${total - 1} / ${total}`)

  await button(page, "Повторити помилки (1)").click()
  await expect(card(page)).toContainText("Повторення помилок 1 / 1")
  const question = await currentQuestion(page, REFERENCE)
  await answerer(question).correct(page, question)
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
  await reachType(page, REFERENCE, "short")
  await shortInput(page).fill("abc")
  await shortInput(page).press("Enter")
  await expect(card(page).locator("[data-slot=alert]")).toContainText("Введи число")
  await expect(button(page, "Перевірити")).toBeVisible()
})

test("коротка відповідь з двома полями: обидва обовʼязкові, перевіряються разом", async ({
  page,
}) => {
  const question = await reach(
    page,
    REFERENCE,
    (q) => q.type === "short" && Array.isArray(q.answer),
    "коротка відповідь з двома полями"
  )
  if (question.type !== "short" || !Array.isArray(question.answer))
    throw new Error("очікувалось два поля")
  const [first, second] = question.answer

  await expect(card(page).getByRole("textbox", { name: "Відповідь 1" })).toBeFocused()
  await shortInput(page, 0).fill(String(first))
  await expect(button(page, "Перевірити")).toBeDisabled()
  // поля переплутано — помилка з обома правильними числами у відповіді
  await shortInput(page, 1).fill(String(first))
  await shortInput(page, 0).fill(String(second))
  await button(page, "Перевірити").click()
  await expect(verdict(page)).toContainText(`Неправильно. Відповідь: ${first}; ${second}`)
})

test("кілька правильних: перемикання варіантів, цифра, позначки після перевірки", async ({
  page,
}) => {
  const question = await reachType(page, REFERENCE, "multi")
  if (question.type !== "multi") throw new Error("очікувалось завдання multi")
  const [first, second] = question.answer
  const wrongIndex = question.options.findIndex((_, i) => !question.answer.includes(i))

  // клік вмикає, повторний — вимикає
  await option(page, first).click()
  await expect(option(page, first)).toHaveAttribute("aria-checked", "true")
  await option(page, first).click()
  await expect(option(page, first)).toHaveAttribute("aria-checked", "false")
  await expect(button(page, "Перевірити")).toBeDisabled()

  // цифра перемикає показану позицію: перший показаний варіант
  await page.keyboard.press("1")
  await expect(card(page).getByRole("checkbox").first()).toHaveAttribute("aria-checked", "true")
  await page.keyboard.press("1")
  await expect(card(page).getByRole("checkbox").first()).toHaveAttribute("aria-checked", "false")

  // одна правильна + одна зайва: після перевірки — correct, missed, wrong
  await option(page, first).click()
  await option(page, wrongIndex).click()
  await button(page, "Перевірити").click()
  await expect(verdict(page)).toContainText("Неправильно")
  await expect(option(page, first)).toHaveAttribute("data-mark", "correct")
  await expect(option(page, second)).toHaveAttribute("data-mark", "missed")
  await expect(option(page, wrongIndex)).toHaveAttribute("data-mark", "wrong")
  // після перевірки варіанти лише для читання
  await option(page, second).click()
  await expect(option(page, second)).toHaveAttribute("aria-checked", "false")
})
