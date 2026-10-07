import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

import { EXAM } from "../model/exam"
import type { Draft, Question, RenderedQuestion } from "../model/question/registry"

/** Літери варіантів і рівні складності — з профілю іспиту. */
export const LETTERS = EXAM.letters
export const LEVELS = EXAM.levels

/** Стан варіанта/клітинки після вибору та перевірки. */
export type Mark = "idle" | "selected" | "correct" | "missed" | "wrong"

/**
 * Пропси поля відповіді — однакові для всіх типів; `T` звужує завдання й чернетку до типу.
 * `onAnswer` приймає точкове оновлення чернетки свого типу; обгортання в `updateDraft`
 * робить `answer-field.tsx`, компоненти про reducer не знають.
 */
export interface AnswerProps<T extends Question["type"] = Question["type"]> {
  question: Extract<RenderedQuestion, { type: T }>
  draft: Extract<Draft, { type: T }>
  /** Порядок показу варіантів (індекси); порожній, якщо тип не перемішує. */
  order: number[]
  checked: boolean
  correct: boolean
  onAnswer: (update: (draft: Extract<Draft, { type: T }>) => Extract<Draft, { type: T }>) => void
}

export type AnswerComponent<T extends Question["type"] = Question["type"]> = (
  props: AnswerProps<T>
) => ReactNode

/** Класи для блокового HTML (абзаци, виносні формули, таблиці, списки) поза prose. */
const BLOCK =
  "[&_p+p]:mt-2 [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_table]:mx-auto [&_table]:my-2 [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_img]:my-3"

/**
 * HTML, згенерований під час збирання з нашого ж Markdown (див. ../model/render.ts),
 * тому вставляти його напряму безпечно. `as="div"` — для блокового вмісту (умова, пояснення).
 */
export function Html({
  html,
  as: Tag = "span",
  className,
}: {
  html: string
  as?: "span" | "div"
  className?: string
}) {
  return (
    <Tag
      className={cn("[&_.katex]:text-[1.05em]", Tag === "div" && BLOCK, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
