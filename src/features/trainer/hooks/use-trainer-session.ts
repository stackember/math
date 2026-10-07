import { useReducer } from "react"

import type { TrainerResult } from "../model/progress"
import type { Draft, RenderedQuestion } from "../model/question/registry"
import {
  createSession,
  currentStep,
  isFinished,
  isLastStep,
  score,
  sessionReducer,
  tagStats,
  wrongQuestions,
} from "../model/session"

export interface TrainerSessionOptions {
  /** Викликається, коли завершено повний прохід (повтор помилок рекорду не змінює). */
  onComplete?: (result: TrainerResult) => void
}

/** Проходження тренажера: стан сесії (reducer з model/session) і дії для інтерфейсу. */
export function useTrainerSession(
  questions: RenderedQuestion[],
  { onComplete }: TrainerSessionOptions = {}
) {
  const [session, dispatch] = useReducer(sessionReducer, questions, (initial) =>
    createSession(initial, "full")
  )
  const finished = isFinished(session)

  const next = () => {
    if (session.checked && isLastStep(session) && session.mode === "full") {
      onComplete?.({
        score: score(session),
        total: session.steps.length,
        tags: Object.fromEntries(tagStats(session)),
      })
    }
    dispatch({ type: "next" })
  }

  const retryWrong = () => {
    const wrong = wrongQuestions(session)
    if (wrong.length > 0) dispatch({ type: "start", session: createSession(wrong, "retry") })
  }

  return {
    session,
    finished,
    step: finished ? null : currentStep(session),
    checked: session.checked,
    correct: session.results[session.index] === true,
    /** Точкове оновлення відповіді — `updateDraft` з модуля типу завдання. */
    answer: (update: (draft: Draft) => Draft) => dispatch({ type: "answer", update }),
    check: () => dispatch({ type: "check" }),
    next,
    restart: () => dispatch({ type: "start", session: createSession(questions, "full") }),
    retryWrong,
  }
}
