import { z } from "zod"

import { EXAM } from "../exam"
import { common, text, type QuestionModule } from "./base"

const unique = (items: readonly unknown[]) => new Set(items).size === items.length

/** Відповідність: кожному пункту 1–3 — один варіант А–Д. */
const schema = z
  .strictObject({
    type: z.literal("match"),
    ...common,
    left: z.array(text).length(EXAM.matchLeft, { error: `left: рівно ${EXAM.matchLeft} пункти` }),
    right: z
      .array(text)
      .length(EXAM.matchRight, { error: `right: рівно ${EXAM.matchRight} варіантів` }),
    /** `answer[i]` — індекс у `right` для рядка `left[i]`. */
    answer: z
      .array(
        z
          .int({ error: "answer: індекси варіантів у right, з 0" })
          .min(0, { error: "answer: індекси з 0" })
          .max(EXAM.matchRight - 1, { error: `answer: індекси від 0 до ${EXAM.matchRight - 1}` })
      )
      .length(EXAM.matchLeft, {
        error: `answer: по одному індексу на кожен з ${EXAM.matchLeft} пунктів`,
      }),
  })
  .superRefine((question, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message })
    if (!unique(question.left)) issue("left", "пункти повторюються")
    if (!unique(question.right)) issue("right", "варіанти повторюються")
    if (!unique(question.answer)) issue("answer", "відповіді у відповідності мають бути різними")
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
    answerHint: `${EXAM.matchLeft} пункти (1–${EXAM.matchLeft}) і ${EXAM.matchRight} варіантів (${EXAM.letters[0]}–${EXAM.letters.at(-1)}), сітка як у бланку НМТ: у кожному рядку обрати одну клітинку`,
    example: `- type: match
  level: 2
  tag: classify
  q: Установіть відповідність між числом (1–3) та **найменшою** множиною (А–Д), якій воно належить.
  left: ['$\\sqrt{49}$', '$-\\frac{18}{6}$', '$0{,}(4)$'] # рівно ${EXAM.matchLeft}
  right: ['$\\N$ — натуральні', '$\\Z$ — цілі', '$\\Q$ — раціональні', '$\\I$ — ірраціональні', '$\\R$ — дійсні'] # рівно ${EXAM.matchRight}, не перемішуються
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
  answerHtml: (question) =>
    question.answer.map((column, row) => `${row + 1}–${EXAM.letters[column]}`).join(", "),
  correctDraft: (question) => ({ type: "match", match: [...question.answer] }),
  // відповіді різні, тож після зсуву на один кожен рядок хибний
  wrongDraft: (question) => ({
    type: "match",
    match: question.answer.map((_, row) => question.answer[(row + 1) % question.answer.length]),
  }),
} satisfies QuestionModule<typeof schema, MatchDraft>
