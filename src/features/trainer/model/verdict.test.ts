import { describe, expect, it } from "vitest"

import { verdict } from "./verdict"

describe("verdict", () => {
  it.each([
    [1, "Ідеально"],
    [0.8, "Добре"],
    [0.79, "Непогано"],
    [0.5, "Непогано"],
    [0.49, "Повернись до теорії"],
  ])("повний прохід: частка %s → %s", (share, expected) => {
    expect(verdict(share, "full")).toContain(expected)
  })

  it("повтор помилок: або все виправлено, або ще є помилки", () => {
    expect(verdict(1, "retry")).toContain("виправлено")
    expect(verdict(0.5, "retry")).toContain("Ще є помилки")
  })
})
