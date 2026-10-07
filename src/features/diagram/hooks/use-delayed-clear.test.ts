// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useDelayedClear } from "./use-delayed-clear"

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe("useDelayedClear", () => {
  it("скидає значення лише після затримки", () => {
    const { result } = renderHook(() => useDelayedClear<number>(150))
    act(() => result.current[1].show(1))
    expect(result.current[0]).toBe(1)

    act(() => result.current[1].clearSoon())
    act(() => vi.advanceTimersByTime(149))
    expect(result.current[0]).toBe(1)
    act(() => vi.advanceTimersByTime(1))
    expect(result.current[0]).toBeNull()
  })

  it("нове значення скасовує заплановане скидання", () => {
    const { result } = renderHook(() => useDelayedClear<number>(150))
    act(() => result.current[1].show(1))
    act(() => result.current[1].clearSoon())
    act(() => result.current[1].show(2))
    act(() => vi.advanceTimersByTime(300))
    expect(result.current[0]).toBe(2)
  })
})
