import type { Locator, Page } from "@playwright/test"

import type { Question } from "@/features/trainer/model/question/registry"

/** Усі локатори — в межах картки тренажера, щоб елементи поза нею (меню, футер) не заважали. */
export const card = (page: Page) => page.locator("[data-slot=card]")
/** Варіант за індексом із frontmatter (`data-option`), у відповідності — ще й рядок (`data-row`). */
export const option = (page: Page, index: number, row?: number) =>
  card(page).locator(
    row === undefined ? `[data-option="${index}"]` : `[data-row="${row}"] [data-option="${index}"]`
  )
/** Поле короткої відповіді: єдине або за індексом (`data-field`), коли полів кілька. */
export const shortInput = (page: Page, field = 0): Locator =>
  card(page).locator(`[data-answer=short] [data-field="${field}"]`)

interface Answerer<Q> {
  /** Правильна відповідь із frontmatter. */
  correct(page: Page, question: Q): Promise<void>
  /** Свідомо неправильна відповідь, яку тренажер приймає до перевірки. */
  wrong(page: Page, question: Q): Promise<void>
}

type Of<T extends Question["type"]> = Extract<Question, { type: T }>

/**
 * Як відповісти в браузері на завдання кожного типу. Новий тип без відповідача — помилка компіляції.
 * Повне проходження практики (`trainer.spec.ts`) працює через цей реєстр і типів не знає.
 */
export const ANSWERERS = {
  choice: {
    correct: (page, q) => option(page, q.answer).click(),
    wrong: (page, q) => option(page, (q.answer + 1) % q.options.length).click(),
  },
  match: {
    async correct(page, q) {
      for (const [row, column] of q.answer.entries()) await option(page, column, row).click()
    },
    // зсунуті пари: відповіді різні, тож усі рядки хибні
    async wrong(page, q) {
      for (const [row] of q.answer.entries())
        await option(page, q.answer[(row + 1) % q.answer.length], row).click()
    },
  },
  multi: {
    async correct(page, q) {
      for (const index of q.answer) await option(page, index).click()
    },
    // доповнення: усі хибні варіанти (їх хоч один — вимагає схема)
    async wrong(page, q) {
      for (const index of q.options.keys()) {
        if (!q.answer.includes(index)) await option(page, index).click()
      }
    },
  },
  short: {
    async correct(page, q) {
      const answers = Array.isArray(q.answer) ? q.answer : [q.answer]
      for (const [field, answer] of answers.entries())
        await shortInput(page, field).fill(String(answer))
    },
    async wrong(page, q) {
      const answers = Array.isArray(q.answer) ? q.answer : [q.answer]
      for (const [field, answer] of answers.entries())
        await shortInput(page, field).fill(String(field === 0 ? answer + 1 : answer))
    },
  },
} satisfies { [T in Question["type"]]: Answerer<Of<T>> }

/** Відповідач для завдання — єдине місце, де тип стирається. */
export const answerer = (question: Question) =>
  ANSWERERS[question.type] as unknown as Answerer<Question>
