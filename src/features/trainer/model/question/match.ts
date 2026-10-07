import { z } from "zod"

import type { ExamProfile } from "../exam/profile"
import { common, text, uniqueIssue, type QuestionModule } from "./base"

/** Відповідність: кожному пункту зліва — один варіант справа (розміри — з профілю іспиту). */
const schema = ({ match: { left, right } }: ExamProfile) =>
  z
    .strictObject({
      type: z.literal("match"),
      ...common,
      left: z.array(text).length(left, { error: `left: рівно ${left} пункти` }),
      right: z.array(text).length(right, { error: `right: рівно ${right} варіантів` }),
      /** `answer[i]` — індекс у `right` для рядка `left[i]`. */
      answer: z
        .array(
          z
            .int({ error: "answer: індекси варіантів у right, з 0" })
            .min(0, { error: "answer: індекси з 0" })
            .max(right - 1, { error: `answer: індекси від 0 до ${right - 1}` })
        )
        .length(left, { error: `answer: по одному індексу на кожен з ${left} пунктів` }),
    })
    .superRefine((q, ctx) => {
      uniqueIssue(ctx, q.left, "left", "пункти повторюються")
      uniqueIssue(ctx, q.right, "right", "варіанти повторюються")
      uniqueIssue(ctx, q.answer, "answer", "відповіді у відповідності мають бути різними")
    })

export interface MatchDraft {
  type: "match"
  /** `match[row]` — обрана колонка (індекс у `right`) або `null`. */
  match: (number | null)[]
}

/** Обрати варіант для рядка. */
export const pick = (row: number, column: number) => (draft: MatchDraft) => ({
  ...draft,
  match: draft.match.map((cell, i) => (i === row ? column : cell)),
})

export const match = {
  type: "match",
  schema,
  meta: {
    label: "відповідність",
    answerHint:
      "сітка як у бланку: у кожному рядку обрати одну клітинку; варіанти не перемішуються",
    example: `- type: match
  level: 2
  tag: classify
  q: Установіть відповідність між числом (1–3) та **найменшою** множиною (А–Д), якій воно належить.
  left: ['$\\sqrt{49}$', '$-\\frac{18}{6}$', '$0{,}(4)$'] # стільки, скільки пунктів у профілі
  right: ['$\\N$ — натуральні', '$\\Z$ — цілі', '$\\Q$ — раціональні', '$\\I$ — ірраціональні', '$\\R$ — дійсні']
  answer: [0, 1, 2] # answer[i] — індекс у right для left[i]; усі різні
  why: '$\\sqrt{49} = 7 \\in \\N$; $-\\frac{18}{6} = -3 \\in \\Z$; $0{,}(4) = \\frac49 \\in \\Q$.'`,
  },
  async render(question, md) {
    const all = (items: string[]) => Promise.all(items.map((item) => md.inline(item)))
    return { ...question, left: await all(question.left), right: await all(question.right) }
  },
  displayOrder: () => [],
  emptyDraft: (question) => ({ type: "match", match: question.left.map(() => null) }),
  isAnswered: (draft) => draft.match.every((cell) => cell !== null),
  invalidReason: () => null,
  isCorrect: (question, draft) =>
    question.answer.every((column, row) => draft.match[row] === column),
  answerHtml: (question, _order, { letters }) =>
    question.answer.map((column, row) => `${row + 1}–${letters[column]}`).join(", "),
  correctDraft: (question) => ({ type: "match", match: [...question.answer] }),
  // відповіді різні, тож після зсуву на один кожен рядок хибний
  wrongDraft: (question) => ({
    type: "match",
    match: question.answer.map((_, row) => question.answer[(row + 1) % question.answer.length]),
  }),
} satisfies QuestionModule<typeof schema, MatchDraft>
