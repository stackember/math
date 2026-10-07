import { z } from "zod"

import type { CommonRendered, QuestionModule } from "./base"
import { choice } from "./choice"
import { match } from "./match"
import { multi } from "./multi"
import { short } from "./short"

/**
 * Реєстр типів завдань — єдиний список. Новий тип: модуль у цій папці + запис тут;
 * схема, типи `Question` і `Draft`, повідомлення про невідомий `type` виводяться з нього.
 */
export const QUESTION_MODULES = [choice, match, multi, short] as const

/** Кортеж схем модулів (узагальнений параметр — щоб TypeScript зберіг кортеж, а не масив). */
type SchemasOf<T extends readonly unknown[]> = {
  -readonly [K in keyof T]: T[K] extends { schema: infer S } ? S : never
}
type Schemas = SchemasOf<typeof QUESTION_MODULES>

export const questionSchema = z.discriminatedUnion(
  "type",
  QUESTION_MODULES.map((module) => module.schema) as unknown as Schemas,
  { error: `type: ${QUESTION_MODULES.map((m) => `${m.type} (${m.meta.label})`).join(", ")}` }
)

export type Question = z.infer<typeof questionSchema>
/** Завдання після рендеру під час збирання: тексти — HTML, плюс `id` і рисунок. */
export type RenderedQuestion = Question & CommonRendered
/** Чернетка будь-якого типу — з контракту модулів (тип параметра, а не виводу: там він оголошений точно). */
export type Draft = Parameters<(typeof QUESTION_MODULES)[number]["isAnswered"]>[0]

/** Модуль зі стертими типами — для коду, що працює з будь-яким завданням (reducer, картка). */
export type AnyQuestionModule = QuestionModule<z.ZodType<Question>, Draft>

/** Модуль для завдання — єдине місце, де конкретний тип стирається до спільного контракту. */
export function moduleOf(question: Pick<Question, "type">): AnyQuestionModule {
  return QUESTION_MODULES.find((m) => m.type === question.type) as unknown as AnyQuestionModule
}

/**
 * Оновлення чернетки для reducer: застосовується лише до чернетки свого типу,
 * чужу повертає як є. Так reducer лишається загальним, а знання про поля — у модулях.
 */
export function updateDraft<D extends Draft>(type: D["type"], update: (draft: D) => D) {
  return (draft: Draft): Draft => (draft.type === type ? update(draft as D) : draft)
}
