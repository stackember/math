import { z } from "zod"

import type { CommonRendered, QuestionModule } from "./base"
import { choice, schema as choiceSchema, type ChoiceDraft } from "./choice"
import { match, schema as matchSchema, type MatchDraft } from "./match"
import { schema as shortSchema, short, type ShortDraft } from "./short"

/**
 * Реєстр типів завдань. Новий тип: модуль у цій папці + його схема в `questionSchema`
 * + запис у `QUESTION_TYPES` (`satisfies` нижче не дасть пропустити жоден).
 */
export const questionSchema = z.discriminatedUnion(
  "type",
  [choiceSchema, matchSchema, shortSchema],
  {
    error: "type: choice (вибір відповіді), match (відповідність) або short (коротка відповідь)",
  }
)

export type Question = z.infer<typeof questionSchema>
/** Завдання після рендеру під час збирання: тексти — HTML, плюс `id` і рисунок. */
export type RenderedQuestion = Question & CommonRendered
export type Draft = ChoiceDraft | MatchDraft | ShortDraft

const QUESTION_TYPES = { choice, match, short } satisfies Record<Question["type"], unknown>

/** Модуль для завдання — єдине місце, де конкретний тип стирається до спільного контракту. */
export function moduleOf(question: Question): QuestionModule<Question, Draft> {
  return QUESTION_TYPES[question.type] as QuestionModule<Question, Draft>
}

/**
 * Оновлення чернетки для reducer: застосовується лише до чернетки свого типу,
 * чужу повертає як є. Так reducer лишається загальним, а знання про поля — у модулях.
 */
export function updateDraft<D extends Draft>(type: D["type"], update: (draft: D) => D) {
  return (draft: Draft): Draft => (draft.type === type ? update(draft as D) : draft)
}
