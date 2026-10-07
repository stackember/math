import { describe, expect, it } from "vitest"

import { select } from "./question/choice"
import { pick } from "./question/match"
import { updateDraft, type RenderedQuestion } from "./question/registry"
import { input, INVALID_NUMBER } from "./question/short"
import {
  createSession,
  currentStep,
  isFinished,
  score,
  sessionReducer,
  tagStats,
  wrongQuestions,
  type Action,
  type Session,
} from "./session"

const short: RenderedQuestion = {
  index: 0,
  type: "short",
  level: 2,
  tag: "b",
  q: "2+2",
  why: "4",
  answer: 4,
}
const choice: RenderedQuestion = {
  index: 1,
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
  index: 2,
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
const choose = (option: number): Action => ({
  type: "answer",
  update: updateDraft("choice", select(option)),
})
const type = (value: string): Action => ({
  type: "answer",
  update: updateDraft("short", input(0, value)),
})

describe("session", () => {
  it("починає з легких і не чіпає порядок при keepOrder", () => {
    const session = createSession([short, choice], "full")
    expect(currentStep(session).question.index).toBe(1)
    expect(currentStep(session).order).toEqual([0, 1, 2, 3, 4])
  })

  it("без завдань не стартує", () => {
    expect(() => createSession([], "full")).toThrow(/без завдань/)
  })

  it("проходить тест і рахує результат", () => {
    let s = createSession([short, choice], "full")
    s = run(s, { type: "check" })
    expect(s.checked).toBe(false) // без відповіді перевірка не спрацьовує

    s = run(s, choose(2), { type: "check" })
    expect(s.results).toEqual([true])

    s = run(s, choose(0))
    expect(s.draft).toEqual({ type: "choice", choice: 2 }) // після перевірки відповідь заморожена

    s = run(s, { type: "next" }, type("5"), { type: "check" }, { type: "next" })
    expect(isFinished(s)).toBe(true)
    expect(score(s)).toBe(1)
    expect(wrongQuestions(s).map((q) => q.index)).toEqual([0])
    expect(tagStats(s).get("b")).toEqual({ correct: 0, total: 1 })
  })

  it("швидкі кліки у відповідності не перетирають один одного", () => {
    let s = createSession([match], "full")
    s = run(
      s,
      { type: "answer", update: updateDraft("match", pick(0, 0)) },
      { type: "answer", update: updateDraft("match", pick(1, 1)) },
      { type: "answer", update: updateDraft("match", pick(2, 2)) },
      { type: "check" }
    )
    expect(s.results).toEqual([true])
  })

  it("оновлення чужого типу не чіпає чернетку", () => {
    let s = createSession([short], "full")
    s = run(s, choose(2))
    expect(s.draft).toEqual({ type: "short", values: [""] })
  })

  it("не зараховує нечислову коротку відповідь, а просить ввести число", () => {
    let s = createSession([short], "retry")
    s = run(s, type("abc"), { type: "check" })
    expect(s.checked).toBe(false)
    expect(s.warning).toBe(INVALID_NUMBER)
    s = run(s, type("4"))
    expect(s.warning).toBeNull()
  })
})
