import { z } from "zod"

import { EXAM } from "../exam"
import { shuffle } from "../order"
import { common, positionalOptionProblems, text, type QuestionModule } from "./base"

const [MIN_OPTIONS, MAX_OPTIONS] = EXAM.multiOptions

/** Умова має казати, що правильних відповідей кілька. */
const SEVERAL = /(усі|всі|які з|кілька)/iu

/** Кілька правильних відповідей з варіантів А–Д. Поза форматом НМТ — для тренування правил з кількома прикладами. */
const schema = z
  .strictObject({
    type: z.literal("multi"),
    ...common,
    options: z
      .array(text)
      .min(MIN_OPTIONS, { error: `options: від ${MIN_OPTIONS} до ${MAX_OPTIONS} варіантів` })
      .max(MAX_OPTIONS, { error: `options: від ${MIN_OPTIONS} до ${MAX_OPTIONS} варіантів` }),
    /** Індекси правильних варіантів в `options`, з 0; від двох до «всі мінус один». */
    answer: z
      .array(
        z
          .int({ error: "answer: індекси правильних варіантів, з 0" })
          .min(0, { error: "answer: індекси з 0" })
      )
      .min(2, { error: "answer: щонайменше 2 правильних (одна правильна — це type: choice)" }),
    /** Не перемішувати варіанти (напр. числа за зростанням). */
    keepOrder: z.boolean().default(false),
  })
  .superRefine((question, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message })
    const n = question.options.length
    if (new Set(question.options).size !== n) issue("options", "варіанти повторюються")
    if (new Set(question.answer).size !== question.answer.length)
      issue("answer", "answer: індекси повторюються")
    if (question.answer.some((i) => i >= n)) issue("answer", `answer: індекси від 0 до ${n - 1}`)
    if (question.answer.length >= n)
      issue("answer", "answer: не всі варіанти можуть бути правильними — лиши хоч один хибний")
  })
  .transform((question) => ({ ...question, answer: [...question.answer].sort((a, b) => a - b) }))

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
    answerHint: `${MIN_OPTIONS}–${MAX_OPTIONS} варіантів, правильних два чи більше: клік або цифра перемикає варіант; зараховується лише повний збіг`,
    example: `- type: multi
  level: 2
  tag: irrational
  q: Які з чисел ірраціональні? Обери **всі** правильні варіанти.
  options: ['$\\sqrt3$', '$\\sqrt{49}$', '$0{,}(6)$', '$\\sqrt8$', '$-\\frac52$'] # ${MIN_OPTIONS}–${MAX_OPTIONS}
  answer: [0, 3] # індекси правильних, з 0; від 2 до «всі мінус один»
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
  // усе або нічого, як у НМТ для відповідності
  isCorrect: (question, draft) => sameSet(draft.chosen, question.answer),
  answerHtml: (question, order) =>
    order
      .flatMap((option, position) =>
        question.answer.includes(option) ? [EXAM.letters[position]] : []
      )
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
