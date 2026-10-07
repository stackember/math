import { z } from "zod"

import { EXAM } from "../exam"
import { common, text, type QuestionModule } from "./base"

const unique = (items: readonly unknown[]) => new Set(items).size === items.length

/** Відповідність: кожному пункту 1–3 — один варіант А–Д. */
export const schema = z
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

export type MatchQuestion = z.infer<typeof schema>

export interface MatchDraft {
  type: "match"
  /** `match[row]` — обрана колонка (індекс у `right`) або `null`. */
  match: (number | null)[]
}

export const match: QuestionModule<MatchQuestion, MatchDraft> = {
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
}

/** Обрати варіант для рядка. */
export const pick = (row: number, column: number) => (draft: MatchDraft) => ({
  ...draft,
  match: draft.match.map((cell, i) => (i === row ? column : cell)),
})
