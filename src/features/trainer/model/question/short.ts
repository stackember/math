import { z } from "zod"

import { formatNumber, parseNumber } from "../number"
import { common, type QuestionModule } from "./base"

export const INVALID_NUMBER = "Введи число, наприклад 4, −2,5 або 0,75."

/** Число можна точно ввести з клавіатури: ціле або десятковий дріб до 4 знаків. */
const isTypeable = (n: number) =>
  Number.isFinite(n) && Math.abs(n * 1e4 - Math.round(n * 1e4)) < 1e-9

/** Коротка відповідь: число. */
const schema = z.strictObject({
  type: z.literal("short"),
  ...common,
  /** Ціле або скінченний десятковий дріб: 4, -2.5, 0.75. */
  answer: z
    .number({ error: "answer: число, напр. 4 або -2.5 (не рядок)" })
    .refine(isTypeable, { error: "answer: ціле число або десятковий дріб до 4 знаків після коми" }),
})

export interface ShortDraft {
  type: "short"
  value: string
}

/** Ввести текст відповіді. */
export const input = (value: string) => (draft: ShortDraft) => ({ ...draft, value })

export const short = {
  type: "short",
  schema,
  meta: {
    label: "коротка відповідь",
    answerHint:
      "поле для числа: ціле або десятковий дріб (кома чи крапка), мінус будь-який, дріб −5/2 теж приймається",
    example: `- type: short
  level: 2
  tag: classify
  q: 'Скільки **цілих** чисел серед: $-7$; $2{,}5$; $0$; $\\sqrt{25}$?'
  answer: 3 # число, не рядок: 4, -2.5
  why: 'Цілі: $-7$, $0$, $\\sqrt{25} = 5$.'`,
  },
  render: async (question) => question,
  displayOrder: () => [],
  emptyDraft: () => ({ type: "short", value: "" }),
  isAnswered: (draft) => draft.value.trim() !== "",
  invalidReason: (draft) => (parseNumber(draft.value) === null ? INVALID_NUMBER : null),
  isCorrect(question, draft) {
    const value = parseNumber(draft.value)
    return value !== null && Math.abs(value - question.answer) < 1e-9
  },
  answerHtml: (question) => formatNumber(question.answer),
  // як у підручнику («−2,5») — заодно перевіряє розбір такого запису
  correctDraft: (question) => ({ type: "short", value: formatNumber(question.answer) }),
  wrongDraft: (question) => ({ type: "short", value: String(question.answer + 1) }),
} satisfies QuestionModule<typeof schema, ShortDraft>
