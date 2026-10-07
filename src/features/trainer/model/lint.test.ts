import { describe, expect, it } from "vitest"

import { lintQuestion } from "./lint"
import type { Question } from "./question/registry"

const common = { level: 1 as const, tag: "t", q: "q", why: "why" }
const choice = (options: string[], keepOrder = false): Question => ({
  ...common,
  type: "choice",
  options,
  answer: 0,
  keepOrder,
})
const multi = (options: string[], q = "Які з них?"): Question => ({
  ...common,
  type: "multi",
  q,
  options,
  answer: [0, 1],
  keepOrder: false,
})

describe("варіант, що залежить від порядку (choice і multi)", () => {
  it.each([
    "усі перелічені",
    "Усе перелічене",
    "жодне з наведених",
    "жодне із цих",
    "обидва варіанти А і Б",
    "варіанти А та В",
  ])("ловить «%s»", (option) => {
    const problems = lintQuestion(choice(["1", "2", "3", "4", option]))
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain(option)
    expect(lintQuestion(multi(["1", "2", option]))).toHaveLength(1)
  })

  it("звичайні варіанти і keepOrder проходять", () => {
    expect(lintQuestion(choice(["1", "2", "3", "4", "5"]))).toEqual([])
    expect(lintQuestion(choice(["1", "2", "3", "4", "усі перелічені"], true))).toEqual([])
  })
})

describe("суворість", () => {
  it("попередження типу видно лише з severity warn", () => {
    const question = multi(["1", "2", "3"], "Назви ірраціональні.")
    expect(lintQuestion(question)).toEqual([])
    expect(lintQuestion(question, "warn")).toEqual([
      expect.stringMatching(/правильних відповідей кілька/),
    ])
  })
})
