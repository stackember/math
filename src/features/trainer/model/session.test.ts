import { describe, expect, it } from "vitest"

import type { RenderedQuestion } from "./schema"
import {
  createSession,
  currentStep,
  INVALID_NUMBER,
  isFinished,
  score,
  sessionReducer,
  tagStats,
  wrongQuestions,
  type Action,
  type Session,
} from "./session"

const short: RenderedQuestion = {
  id: 0,
  type: "short",
  level: 2,
  tag: "b",
  q: "2+2",
  why: "4",
  answer: 4,
}
const choice: RenderedQuestion = {
  id: 1,
  type: "choice",
  level: 1,
  tag: "a",
  q: "Обери В",
  why: "В",
  options: ["А", "Б", "В", "Г", "Д"],
  answer: 2,
  keepOrder: true,
}
const match: RenderedQuestion = {
  id: 2,
  type: "match",
  level: 1,
  tag: "a",
  q: "Відповідність",
  why: "…",
  left: ["1", "2", "3"],
  right: ["А", "Б", "В", "Г", "Д"],
  answer: [0, 1, 2],
}

const run = (state: Session, ...actions: Action[]) => actions.reduce(sessionReducer, state)

describe("session", () => {
  it("починає з легких і не чіпає порядок при keepOrder", () => {
    const session = createSession([short, choice], "full")
    expect(currentStep(session).question.id).toBe(1)
    expect(currentStep(session).order).toEqual([0, 1, 2, 3, 4])
  })

  it("проходить тест і рахує результат", () => {
    let s = createSession([short, choice], "full")
    s = run(s, { type: "check" })
    expect(s.checked).toBe(false) // без відповіді перевірка не спрацьовує

    s = run(s, { type: "choose", option: 2 }, { type: "check" })
    expect(s.results).toEqual([true])

    s = run(s, { type: "choose", option: 0 })
    expect(s.draft).toEqual({ type: "choice", choice: 2 }) // після перевірки відповідь заморожена

    s = run(s, { type: "next" }, { type: "input", value: "5" }, { type: "check" }, { type: "next" })
    expect(isFinished(s)).toBe(true)
    expect(score(s)).toBe(1)
    expect(wrongQuestions(s).map((q) => q.id)).toEqual([0])
    expect(tagStats(s).get("b")).toEqual({ correct: 0, total: 1 })
  })

  it("швидкі кліки у відповідності не перетирають один одного", () => {
    let s = createSession([match], "full")
    s = run(
      s,
      { type: "match", row: 0, column: 0 },
      { type: "match", row: 1, column: 1 },
      { type: "match", row: 2, column: 2 },
      { type: "check" }
    )
    expect(s.results).toEqual([true])
  })

  it("не зараховує нечислову коротку відповідь, а просить ввести число", () => {
    let s = createSession([short], "retry")
    s = run(s, { type: "input", value: "abc" }, { type: "check" })
    expect(s.checked).toBe(false)
    expect(s.warning).toBe(INVALID_NUMBER)
    s = run(s, { type: "input", value: "4" })
    expect(s.warning).toBeNull()
  })
})
