import { z } from "zod"

import { EXAM } from "../exam"
import { shuffle } from "../order"
import { common, positionalOptionProblems, text, type QuestionModule } from "./base"

/** Вибір однієї відповіді з варіантів А–Д. */
const schema = z
  .strictObject({
    type: z.literal("choice"),
    ...common,
    options: z.array(text).length(EXAM.choiceOptions, {
      error: `має бути рівно ${EXAM.choiceOptions} варіантів`,
    }),
    /** Індекс правильного варіанта в `options`, з 0. */
    answer: z
      .int({ error: "answer: індекс правильного варіанта, з 0" })
      .min(0, { error: "answer: індекс з 0" })
      .max(EXAM.choiceOptions - 1, { error: `answer: від 0 до ${EXAM.choiceOptions - 1}` }),
    /** Не перемішувати варіанти (напр. числа за зростанням). */
    keepOrder: z.boolean().default(false),
  })
  .superRefine((question, ctx) => {
    if (new Set(question.options).size !== question.options.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "варіанти повторюються" })
    }
  })

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
    answerHint: `${EXAM.choiceOptions} варіантів ${EXAM.letters[0]}–${EXAM.letters.at(-1)}, правильний один: клік по варіанту або цифра 1–${EXAM.choiceOptions}`,
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
  answerHtml: (question, order) =>
    `${EXAM.letters[order.indexOf(question.answer)]}) ${question.options[question.answer]}`,
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
