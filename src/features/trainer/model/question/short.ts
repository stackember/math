import { z } from "zod"

import { EXAM } from "../exam"
import { formatNumber, parseNumber } from "../number"
import { common, type QuestionModule } from "./base"

export const INVALID_NUMBER = "Введи число, наприклад 4, −2,5 або 0,75."

/** Число можна точно ввести з клавіатури: ціле або десятковий дріб до 4 знаків. */
const isTypeable = (n: number) =>
  Number.isFinite(n) && Math.abs(n * 1e4 - Math.round(n * 1e4)) < 1e-9

const number = z
  .number({ error: "answer: число, напр. 4 або -2.5 (не рядок)" })
  .refine(isTypeable, { error: "answer: ціле число або десятковий дріб до 4 знаків після коми" })

/** Коротка відповідь: число або кілька чисел у окремих полях (структурована відповідь НМТ). */
const schema = z.strictObject({
  type: z.literal("short"),
  ...common,
  /** Ціле або скінченний десятковий дріб: 4, -2.5, 0.75; кілька полів — масив [3, -2]. */
  answer: z.union(
    [
      number,
      z
        .array(number)
        .min(2, { error: "answer: одне число або масив з 2 чисел — по одному на поле" })
        .max(EXAM.shortAnswers, {
          error: `answer: щонайбільше ${EXAM.shortAnswers} поля, як на бланку`,
        }),
    ],
    { error: "answer: число (4, -2.5) або масив чисел для кількох полів ([3, -2])" }
  ),
})

type ShortQuestion = z.output<typeof schema>

export interface ShortDraft {
  type: "short"
  /** Текст у кожному полі — по одному на число у `answer`. */
  values: string[]
}

/** Правильні відповіді як список — одна чи кілька. */
const answersOf = (question: ShortQuestion): number[] =>
  Array.isArray(question.answer) ? question.answer : [question.answer]

/** Ввести текст у поле. */
export const input = (field: number, value: string) => (draft: ShortDraft) => ({
  ...draft,
  values: draft.values.map((v, i) => (i === field ? value : v)),
})

export const short = {
  type: "short",
  schema,
  meta: {
    label: "коротка відповідь",
    answerHint: `поле для числа: ціле або десятковий дріб (кома чи крапка), мінус будь-який, дріб −5/2 теж приймається; \`answer: [3, -2]\` — ${EXAM.shortAnswers} поля, як у структурованій відповіді НМТ`,
    example: `- type: short
  level: 2
  tag: classify
  q: 'Скільки **цілих** чисел серед: $-7$; $2{,}5$; $0$; $\\sqrt{25}$?'
  answer: 3 # число, не рядок: 4, -2.5
  why: 'Цілі: $-7$, $0$, $\\sqrt{25} = 5$.'

- type: short
  level: 3
  tag: classify
  q: 'Скільки серед чисел $0$; $-2$; $\\sqrt{81}$; $0{,}5$ натуральних і скільки цілих? У перше поле запиши кількість натуральних, у друге — цілих.'
  answer: [1, 3] # два поля: умова каже, що куди
  why: 'Натуральне лише $\\sqrt{81} = 9$. Цілі — ще $0$ і $-2$: три. $0$ — ціле, але не натуральне.'`,
  },
  render: async (question) => question,
  displayOrder: () => [],
  emptyDraft: (question) => ({ type: "short", values: answersOf(question).map(() => "") }),
  isAnswered: (draft) => draft.values.every((value) => value.trim() !== ""),
  invalidReason: (draft) =>
    draft.values.some((value) => parseNumber(value) === null) ? INVALID_NUMBER : null,
  isCorrect(question, draft) {
    const expected = answersOf(question)
    return (
      draft.values.length === expected.length &&
      expected.every((answer, i) => {
        const value = parseNumber(draft.values[i])
        return value !== null && Math.abs(value - answer) < 1e-9
      })
    )
  },
  answerHtml: (question) => answersOf(question).map(formatNumber).join("; "),
  // як у підручнику («−2,5») — заодно перевіряє розбір такого запису
  correctDraft: (question) => ({ type: "short", values: answersOf(question).map(formatNumber) }),
  wrongDraft: (question) => ({
    type: "short",
    values: answersOf(question).map((answer, i) => String(i === 0 ? answer + 1 : answer)),
  }),
} satisfies QuestionModule<typeof schema, ShortDraft>
