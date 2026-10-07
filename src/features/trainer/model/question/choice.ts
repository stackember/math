import { z } from "zod"

import type { ExamProfile } from "../exam/profile"
import { shuffle } from "../order"
import { common, positionalOptionProblems, text, uniqueIssue, type QuestionModule } from "./base"

/** Вибір однієї відповіді з варіантів А–Д (кількість — з профілю іспиту). */
const schema = ({ letters }: ExamProfile) => {
  const n = letters.length
  return z
    .strictObject({
      type: z.literal("choice"),
      ...common,
      options: z.array(text).length(n, { error: `має бути рівно ${n} варіантів` }),
      /** Індекс правильного варіанта в `options`, з 0. */
      answer: z
        .int({ error: "answer: індекс правильного варіанта, з 0" })
        .min(0, { error: "answer: індекс з 0" })
        .max(n - 1, { error: `answer: від 0 до ${n - 1}` }),
      /** Не перемішувати варіанти (напр. числа за зростанням). */
      keepOrder: z.boolean().default(false),
    })
    .superRefine((q, ctx) => uniqueIssue(ctx, q.options, "options", "варіанти повторюються"))
}

export interface ChoiceDraft {
  type: "choice"
  /** Індекс обраного варіанта в `options`. */
  choice: number | null
}

/** Обрати варіант. */
export const select = (option: number) => (draft: ChoiceDraft) => ({ ...draft, choice: option })

export const choice = {
  type: "choice",
  schema,
  meta: {
    label: "вибір однієї відповіді",
    answerHint: "клік по варіанту або цифра з його номером",
    example: `- type: choice
  level: 1
  tag: classify
  q: Яке з чисел ірраціональне?
  options: ['$\\sqrt{16}$', '$0{,}(3)$', '$\\sqrt{12}$', '$-\\frac34$', '$3{,}14$']
  answer: 2 # індекс правильного варіанта, з 0
  why: '$12$ не є точним квадратом, тому $\\sqrt{12} \\in \\I$. Решта записуються дробом.'
  # keepOrder: true — лише якщо порядок варіантів важливий (числа за зростанням)`,
  },
  async render(question, md) {
    return { ...question, options: await Promise.all(question.options.map((o) => md.inline(o))) }
  },
  displayOrder(question, random) {
    const indexes = question.options.map((_, i) => i)
    return question.keepOrder ? indexes : shuffle(indexes, random)
  },
  emptyDraft: () => ({ type: "choice", choice: null }),
  isAnswered: (draft) => draft.choice !== null,
  invalidReason: () => null,
  isCorrect: (question, draft) => draft.choice === question.answer,
  answerHtml: (question, order, { letters }) =>
    `${letters[order.indexOf(question.answer)]}) ${question.options[question.answer]}`,
  correctDraft: (question) => ({ type: "choice", choice: question.answer }),
  wrongDraft: (question) => ({
    type: "choice",
    choice: (question.answer + 1) % question.options.length,
  }),
  digit(question, order, digit) {
    const option = order[digit - 1]
    return option === undefined ? null : select(option)
  },
  lint: (question) => positionalOptionProblems(question.options, question.keepOrder),
} satisfies QuestionModule<typeof schema, ChoiceDraft>
