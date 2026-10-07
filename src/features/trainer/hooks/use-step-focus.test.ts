// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { useStepFocus, type StepFocusState } from "./use-step-focus"

function setup(initial: StepFocusState) {
  const card = document.createElement("div")
  card.tabIndex = -1
  const button = document.createElement("button")
  document.body.append(card, button)
  // refs стабільні між рендерами, як useRef у компоненті
  const cardRef = { current: card }
  const buttonRef = { current: button }
  const hook = renderHook((state: StepFocusState) => useStepFocus(cardRef, buttonRef, state), {
    initialProps: initial,
  })
  return { card, button, ...hook }
}

afterEach(() => {
  document.body.innerHTML = ""
})

describe("useStepFocus", () => {
  it("при першому показі фокус не чіпає, при зміні кроку фокусує картку", () => {
    const { card, rerender } = setup({ index: 0, mode: "full", checked: false })
    expect(document.activeElement).toBe(document.body)

    rerender({ index: 1, mode: "full", checked: false })
    expect(document.activeElement).toBe(card)
  })

  it("після перевірки фокус на головній кнопці", () => {
    const { button, rerender } = setup({ index: 0, mode: "full", checked: false })
    rerender({ index: 0, mode: "full", checked: true })
    expect(document.activeElement).toBe(button)
  })

  it("перехід у повтор помилок теж повертає фокус у картку", () => {
    const { card, rerender } = setup({ index: 2, mode: "full", checked: false })
    rerender({ index: 0, mode: "retry", checked: false })
    expect(document.activeElement).toBe(card)
  })
})
