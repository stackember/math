// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { useProgress } from "./use-progress"

describe("useProgress", () => {
  beforeEach(() => localStorage.clear())

  it("порожнє сховище — без результатів; запис дає best і last", () => {
    const { result } = renderHook(() => useProgress("trainer:t"))
    expect(result.current.stats).toEqual({})

    act(() => result.current.record({ score: 3, total: 5 }))
    expect(result.current.stats).toEqual({
      best: { score: 3, total: 5 },
      last: { score: 3, total: 5 },
    })
    expect(JSON.parse(localStorage.getItem("trainer:t") ?? "")).toEqual(result.current.stats)
  })

  it("гірший результат оновлює лише last", () => {
    const { result } = renderHook(() => useProgress("trainer:t"))
    act(() => result.current.record({ score: 5, total: 5 }))
    act(() => result.current.record({ score: 2, total: 5 }))
    expect(result.current.stats.best).toEqual({ score: 5, total: 5 })
    expect(result.current.stats.last).toEqual({ score: 2, total: 5 })
  })

  it("читає старий ключ, якщо за новим ще нічого немає", () => {
    localStorage.setItem("trainer:practice/t", JSON.stringify({ best: { score: 4, total: 5 } }))
    const { result } = renderHook(() => useProgress("trainer:t", "trainer:practice/t"))
    expect(result.current.stats.best).toEqual({ score: 4, total: 5 })
  })

  it("зіпсований запис — як порожнє сховище", () => {
    localStorage.setItem("trainer:t", "{не json")
    const { result } = renderHook(() => useProgress("trainer:t"))
    expect(result.current.stats).toEqual({})
  })
})
