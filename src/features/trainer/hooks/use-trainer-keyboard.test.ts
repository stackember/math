// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useTrainerKeyboard } from "./use-trainer-keyboard"

function setup(enabled = true) {
  const card = document.createElement("div")
  const button = document.createElement("button")
  const input = document.createElement("input")
  card.append(button, input)
  const outside = document.createElement("input")
  document.body.append(card, outside)

  const onEnter = vi.fn()
  const onDigit = vi.fn()
  renderHook(() => useTrainerKeyboard({ current: card }, { enabled, onEnter, onDigit }))

  const press = (target: EventTarget, key: string, init: KeyboardEventInit = {}) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init })
    )

  return { card, button, input, outside, onEnter, onDigit, press }
}

afterEach(() => {
  document.body.innerHTML = ""
})

describe("useTrainerKeyboard", () => {
  it("Enter на сторінці або в картці — головна дія", () => {
    const { card, onEnter, press } = setup()
    press(document.body, "Enter")
    press(card, "Enter")
    expect(onEnter).toHaveBeenCalledTimes(2)
  })

  it("Enter на кнопці в картці лишається браузеру", () => {
    const { button, onEnter, press } = setup()
    const notPrevented = press(button, "Enter")
    expect(onEnter).not.toHaveBeenCalled()
    expect(notPrevented).toBe(true)
  })

  it("фокус поза карткою (меню, пошук) — тренажер не реагує", () => {
    const { outside, onEnter, onDigit, press } = setup()
    press(outside, "Enter")
    press(outside, "2")
    expect(onEnter).not.toHaveBeenCalled()
    expect(onDigit).not.toHaveBeenCalled()
  })

  it("автоповтор і модифікатори ігноруються", () => {
    const { onEnter, onDigit, press } = setup()
    press(document.body, "Enter", { repeat: true })
    press(document.body, "3", { metaKey: true })
    press(document.body, "3", { ctrlKey: true })
    press(document.body, "3", { altKey: true })
    expect(onEnter).not.toHaveBeenCalled()
    expect(onDigit).not.toHaveBeenCalled()
  })

  it("цифра обирає варіант, але не під час введення у поле", () => {
    const { card, input, onDigit, press } = setup()
    press(document.body, "3")
    press(card, "5")
    press(input, "2")
    expect(onDigit.mock.calls).toEqual([[3], [5]])
  })

  it("вимкнений (результат показано) — не слухає", () => {
    const { onEnter, press } = setup(false)
    press(document.body, "Enter")
    expect(onEnter).not.toHaveBeenCalled()
  })
})
