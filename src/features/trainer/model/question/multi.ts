import { z } from "zod"

import type { ExamProfile } from "../exam/profile"
import { shuffle } from "../order"
import { common, positionalOptionProblems, text, uniqueIssue, type QuestionModule } from "./base"

/** Умова має казати, що правильних відповідей кілька. */
const SEVERAL = /(усі|всі|які з|кілька)/iu

/** Кілька правильних відповідей з варіантів; межі кількості варіантів і правильних — з профілю. */
const schema = ({ multi }: ExamProfile) => {
  const [minOptions, maxOptions] = multi.options
  const [minCorrect, maxCorrect] = multi.correct
  return z
    .strictObject({
      type: z.literal("multi"),
      ...common,
      options: z
        .array(text)
        .min(minOptions, { error: `options: від ${minOptions} до ${maxOptions} варіантів` })
        .max(maxOptions, { error: `options: від ${minOptions} до ${maxOptions} варіантів` }),
      /** Індекси правильних варіантів в `options`, з 0. */
      answer: z
        .array(
          z
            .int({ error: "answer: індекси правильних варіантів, з 0" })
            .min(0, { error: "answer: індекси з 0" })
        )
        .min(minCorrect, {
          error: `answer: щонайменше ${minCorrect} правильних (одна правильна — це type: choice)`,
        })
        .max(maxCorrect, { error: `answer: щонайбільше ${maxCorrect} правильних` }),
      /** Не перемішувати варіанти (напр. числа за зростанням). */
      keepOrder: z.boolean().default(false),
    })
    .superRefine((q, ctx) => {
      const n = q.options.length
      uniqueIssue(ctx, q.options, "options", "варіанти повторюються")
      uniqueIssue(ctx, q.answer, "answer", "answer: індекси повторюються")
      if (q.answer.some((i) => i >= n))
        ctx.addIssue({
          code: "custom",
          path: ["answer"],
          message: `answer: індекси від 0 до ${n - 1}`,
        })
      if (q.answer.length >= n)
        ctx.addIssue({
          code: "custom",
          path: ["answer"],
          message: "answer: не всі варіанти можуть бути правильними — лиши хоч один хибний",
        })
    })
    .transform((q) => ({ ...q, answer: [...q.answer].sort((a, b) => a - b) }))
}

export interface MultiDraft {
  type: "multi"
  /** Індекси обраних варіантів в `options`, за зростанням. */
  chosen: number[]
}

/** Перемкнути варіант. */
export const toggle = (option: number) => (draft: MultiDraft) => ({
  ...draft,
  chosen: draft.chosen.includes(option)
    ? draft.chosen.filter((o) => o !== option)
    : [...draft.chosen, option].sort((a, b) => a - b),
})

const sameSet = (a: number[], b: number[]) =>
  a.length === b.length && a.every((value) => b.includes(value))

export const multi = {
  type: "multi",
  schema,
  meta: {
    label: "кілька правильних відповідей",
    answerHint: "клік або цифра перемикає варіант; зараховується лише повний збіг",
    example: `- type: multi
  level: 2
  tag: irrational
  q: Які з чисел ірраціональні? Обери **всі** правильні варіанти.
  options: ['$\\sqrt3$', '$\\sqrt{49}$', '$0{,}(6)$', '$\\sqrt8$', '$-\\frac52$']
  answer: [0, 3] # індекси правильних, з 0; межі — з профілю іспиту
  why: '$\\sqrt3$ і $\\sqrt8 = 2\\sqrt2$ не добуваються. $\\sqrt{49} = 7$, $0{,}(6) = \\frac23$ і $-\\frac52$ записуються дробом.'`,
  },
  async render(question, md) {
    return { ...question, options: await Promise.all(question.options.map((o) => md.inline(o))) }
  },
  displayOrder(question, random) {
    const indexes = question.options.map((_, i) => i)
    return question.keepOrder ? indexes : shuffle(indexes, random)
  },
  emptyDraft: () => ({ type: "multi", chosen: [] }),
  isAnswered: (draft) => draft.chosen.length > 0,
  invalidReason: () => null,
  // усе або нічого, як на іспиті для відповідності
  isCorrect: (question, draft) => sameSet(draft.chosen, question.answer),
  answerHtml: (question, order, { letters }) =>
    order
      .flatMap((option, position) => (question.answer.includes(option) ? [letters[position]] : []))
      .join(", "),
  correctDraft: (question) => ({ type: "multi", chosen: [...question.answer] }),
  // доповнення до всіх варіантів: непорожнє, бо схема не дає зробити всі варіанти правильними
  wrongDraft: (question) => ({
    type: "multi",
    chosen: question.options.map((_, i) => i).filter((i) => !question.answer.includes(i)),
  }),
  digit(question, order, digit) {
    const option = order[digit - 1]
    return option === undefined ? null : toggle(option)
  },
  lint: (question) => [
    ...positionalOptionProblems(question.options, question.keepOrder),
    ...(SEVERAL.test(question.q)
      ? []
      : [
          {
            severity: "warn" as const,
            text: "умова не каже, що правильних відповідей кілька — додай «Обери всі правильні варіанти»",
          },
        ]),
  ],
} satisfies QuestionModule<typeof schema, MultiDraft>
