import { z } from "zod"

import { EXAM } from "../exam"
import { shuffle } from "../order"
import { common, text, type QuestionModule } from "./base"

/** Вибір однієї відповіді з варіантів А–Д. */
export const schema = z
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

export type ChoiceQuestion = z.infer<typeof schema>

export interface ChoiceDraft {
  type: "choice"
  /** Індекс обраного варіанта в `options`. */
  choice: number | null
}

export const choice: QuestionModule<ChoiceQuestion, ChoiceDraft> = {
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
}

/** Обрати варіант. */
export const select = (option: number) => (draft: ChoiceDraft) => ({ ...draft, choice: option })
