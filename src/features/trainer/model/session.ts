import {
  emptyDraft,
  isAnswered,
  isCorrect,
  orderByLevel,
  parseNumber,
  shuffle,
  type Draft,
} from "./check"
import type { RenderedQuestion } from "./schema"

/**
 * Проходження тренажера як скінченний автомат без React:
 * відповідаю → перевірено → (наступне | результат).
 */
export interface Step {
  question: RenderedQuestion
  /** Порядок показу варіантів для choice (індекси `options`). */
  order: number[]
}

export interface Session {
  mode: "full" | "retry"
  steps: Step[]
  index: number
  results: boolean[]
  draft: Draft
  checked: boolean
  warning: string | null
}

/**
 * Дії з відповіддю — точкові (choose/match/input), а не «ось уся нова відповідь»:
 * reducer застосовує їх до поточного стану, тож швидкі кліки не перетирають один одного.
 */
export type Action =
  | { type: "start"; session: Session }
  | { type: "choose"; option: number }
  | { type: "match"; row: number; column: number }
  | { type: "input"; value: string }
  | { type: "check" }
  | { type: "next" }

function updateDraft(draft: Draft, action: Action): Draft {
  if (action.type === "choose" && draft.type === "choice")
    return { ...draft, choice: action.option }
  if (action.type === "match" && draft.type === "match") {
    return {
      ...draft,
      match: draft.match.map((cell, row) => (row === action.row ? action.column : cell)),
    }
  }
  if (action.type === "input" && draft.type === "short") return { ...draft, value: action.value }
  return draft
}

export const INVALID_NUMBER = "Введи число, наприклад 4, −2,5 або 0,75."

/** Створює новий прохід. Випадковість — тут, щоб reducer лишався чистим. */
export function createSession(
  questions: RenderedQuestion[],
  mode: Session["mode"],
  random: () => number = Math.random
): Session {
  const steps = orderByLevel(questions, random).map((question) => {
    const indexes = question.type === "choice" ? question.options.map((_, i) => i) : []
    const keep = question.type === "choice" && question.keepOrder
    return { question, order: keep ? indexes : shuffle(indexes, random) }
  })
  return {
    mode,
    steps,
    index: 0,
    results: [],
    draft: emptyDraft(steps[0].question),
    checked: false,
    warning: null,
  }
}

export function sessionReducer(state: Session, action: Action): Session {
  switch (action.type) {
    case "start":
      return action.session

    case "choose":
    case "match":
    case "input":
      return state.checked
        ? state
        : { ...state, draft: updateDraft(state.draft, action), warning: null }

    case "check": {
      if (state.checked || isFinished(state) || !isAnswered(state.draft)) return state
      if (state.draft.type === "short" && parseNumber(state.draft.value) === null) {
        return { ...state, warning: INVALID_NUMBER }
      }
      const correct = isCorrect(currentStep(state).question, state.draft)
      return { ...state, checked: true, warning: null, results: [...state.results, correct] }
    }

    case "next": {
      if (!state.checked) return state
      const index = state.index + 1
      const step = state.steps[index]
      return {
        ...state,
        index,
        checked: false,
        draft: step ? emptyDraft(step.question) : state.draft,
      }
    }
  }
}

export const currentStep = (s: Session) => s.steps[s.index]
export const isFinished = (s: Session) => s.index >= s.steps.length
export const isLastStep = (s: Session) => s.index === s.steps.length - 1
export const score = (s: Session) => s.results.filter(Boolean).length

export const wrongQuestions = (s: Session) =>
  s.steps.filter((_, i) => s.results[i] === false).map((step) => step.question)

/** Скільки правильних по кожному тегу (правилу теми). */
export function tagStats(s: Session): Map<string, { correct: number; total: number }> {
  const stats = new Map<string, { correct: number; total: number }>()
  s.steps.forEach((step, i) => {
    const entry = stats.get(step.question.tag) ?? { correct: 0, total: 0 }
    entry.total += 1
    if (s.results[i]) entry.correct += 1
    stats.set(step.question.tag, entry)
  })
  return stats
}
