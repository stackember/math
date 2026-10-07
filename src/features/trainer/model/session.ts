import { orderByLevel } from "./order"
import { moduleOf, type Draft, type RenderedQuestion } from "./question/registry"

/**
 * Проходження тренажера як скінченний автомат без React:
 * відповідаю → перевірено → (наступне | результат).
 * Про типи завдань reducer не знає — усе через модулі з question/registry.
 */
export interface Step {
  question: RenderedQuestion
  /** Порядок показу варіантів (індекси); порожній, якщо тип не перемішує. */
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
 * Відповідь змінюється точковими оновленнями (`updateDraft` з модуля типу), а не «ось уся нова відповідь»:
 * reducer застосовує їх до поточного стану, тож швидкі кліки не перетирають один одного.
 */
export type Action =
  | { type: "start"; session: Session }
  | { type: "answer"; update: (draft: Draft) => Draft }
  | { type: "check" }
  | { type: "next" }

/** Створює новий прохід. Випадковість — тут, щоб reducer лишався чистим. */
export function createSession(
  questions: RenderedQuestion[],
  mode: Session["mode"],
  random: () => number = Math.random
): Session {
  if (questions.length === 0) throw new Error("Тренажер без завдань")
  const steps = orderByLevel(questions, random).map((question) => ({
    question,
    order: moduleOf(question).displayOrder(question, random),
  }))
  return {
    mode,
    steps,
    index: 0,
    results: [],
    draft: moduleOf(steps[0].question).emptyDraft(steps[0].question),
    checked: false,
    warning: null,
  }
}

export function sessionReducer(state: Session, action: Action): Session {
  switch (action.type) {
    case "start":
      return action.session

    case "answer":
      return state.checked ? state : { ...state, draft: action.update(state.draft), warning: null }

    case "check": {
      if (state.checked || isFinished(state)) return state
      const { question } = currentStep(state)
      const type = moduleOf(question)
      if (state.draft.type !== question.type || !type.isAnswered(state.draft)) return state
      const reason = type.invalidReason(state.draft)
      if (reason) return { ...state, warning: reason }
      const correct = type.isCorrect(question, state.draft)
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
        draft: step ? moduleOf(step.question).emptyDraft(step.question) : state.draft,
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

export interface TagStat {
  correct: number
  total: number
}

/** Скільки правильних по кожному тегу (правилу теми). */
export function tagStats(s: Session): Map<string, TagStat> {
  const stats = new Map<string, TagStat>()
  s.steps.forEach((step, i) => {
    const entry = stats.get(step.question.tag) ?? { correct: 0, total: 0 }
    entry.total += 1
    if (s.results[i]) entry.correct += 1
    stats.set(step.question.tag, entry)
  })
  return stats
}
