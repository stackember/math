import { useReducer } from "react"

import type { RenderedQuestion } from "../model/schema"
import {
  createSession,
  currentStep,
  isFinished,
  isLastStep,
  score,
  sessionReducer,
  wrongQuestions,
} from "../model/session"
import type { Score } from "../model/storage"

export interface TrainerSessionOptions {
  /** Викликається, коли завершено повний прохід (повтор помилок рекорду не змінює). */
  onComplete?: (result: Score) => void
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
      onComplete?.({ score: score(session), total: session.steps.length })
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
    choose: (option: number) => dispatch({ type: "choose", option }),
    match: (row: number, column: number) => dispatch({ type: "match", row, column }),
    input: (value: string) => dispatch({ type: "input", value }),
    check: () => dispatch({ type: "check" }),
    next,
    restart: () => dispatch({ type: "start", session: createSession(questions, "full") }),
    retryWrong,
  }
}
