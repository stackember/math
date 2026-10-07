// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { select } from "../model/question/choice"
import { updateDraft, type RenderedQuestion } from "../model/question/registry"
import { input } from "../model/question/short"
import { useTrainerSession } from "./use-trainer-session"

const choice: RenderedQuestion = {
  index: 0,
  type: "choice",
  level: 1,
  tag: "a",
  q: "Обери В",
  why: "В",
  options: ["А", "Б", "В", "Г", "Д"],
  answer: 2,
  keepOrder: true,
}
const short: RenderedQuestion = {
  index: 1,
  type: "short",
  level: 2,
  tag: "b",
  q: "2+2",
  why: "4",
  answer: 4,
}

const choose = (option: number) => updateDraft("choice", select(option))
const type = (value: string) => updateDraft("short", input(0, value))

describe("useTrainerSession", () => {
  it("проходить тест і повідомляє результат лише раз, після повного проходу", () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useTrainerSession([choice, short], { onComplete }))

    expect(result.current.step?.question.index).toBe(0) // легке йде першим
    act(() => result.current.answer(choose(2)))
    act(() => result.current.check())
    expect(result.current.correct).toBe(true)

    act(() => result.current.next())
    expect(onComplete).not.toHaveBeenCalled() // ще не останнє завдання

    act(() => result.current.answer(type("5")))
    act(() => result.current.check())
    expect(result.current.correct).toBe(false)
    act(() => result.current.next())

    expect(result.current.finished).toBe(true)
    expect(onComplete).toHaveBeenCalledWith({
      score: 1,
      total: 2,
      tags: { a: { correct: 1, total: 1 }, b: { correct: 0, total: 1 } },
    })
  })

  it("«Далі» без перевірки не зараховує і не зберігає результат", () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useTrainerSession([short], { onComplete }))
    act(() => result.current.next())
    expect(result.current.finished).toBe(false)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it("повтор помилок бере лише неправильні завдання і не змінює рекорд", () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useTrainerSession([choice, short], { onComplete }))
    act(() => result.current.answer(choose(0))) // помилка
    act(() => result.current.check())
    act(() => result.current.next())
    act(() => result.current.answer(type("4")))
    act(() => result.current.check())
    act(() => result.current.next())
    expect(onComplete).toHaveBeenCalledTimes(1)

    act(() => result.current.retryWrong())
    expect(result.current.session.mode).toBe("retry")
    expect(result.current.session.steps.map((s) => s.question.index)).toEqual([0])

    act(() => result.current.answer(choose(2)))
    act(() => result.current.check())
    act(() => result.current.next())
    expect(result.current.finished).toBe(true)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("повтор без помилок нічого не робить", () => {
    const { result } = renderHook(() => useTrainerSession([short]))
    act(() => result.current.retryWrong())
    expect(result.current.session.mode).toBe("full")
  })
})
