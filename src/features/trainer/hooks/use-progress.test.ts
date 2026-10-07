// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { createProgressStore } from "../model/progress"
import { useProgress } from "./use-progress"

const result = { score: 3, total: 5, tags: { a: { correct: 3, total: 5 } } }

describe("useProgress", () => {
  beforeEach(() => localStorage.clear())

  it("типово читає й пише localStorage браузера", () => {
    const { result: hook } = renderHook(() => useProgress("t"))
    expect(hook.current.progress.best).toBeUndefined()

    act(() => hook.current.record(result))
    expect(hook.current.progress.best).toEqual({ score: 3, total: 5 })
    expect(JSON.parse(localStorage.getItem("trainer:t") ?? "")).toEqual(hook.current.progress)
  })

  it("приймає інше сховище", () => {
    const data = new Map<string, string>()
    const store = createProgressStore(() => ({
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
    }))
    const { result: hook } = renderHook(() => useProgress("t", store))
    act(() => hook.current.record(result))
    expect(data.has("trainer:t")).toBe(true)
    expect(localStorage.getItem("trainer:t")).toBeNull()
  })
})
