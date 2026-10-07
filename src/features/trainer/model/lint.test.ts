import { describe, expect, it } from "vitest"

import { lintQuestion } from "./lint"
import type { Question } from "./question/registry"

const choice = (options: string[], keepOrder = false): Question => ({
  type: "choice",
  level: 1,
  tag: "t",
  q: "q",
  why: "why",
  options,
  answer: 0,
  keepOrder,
})

describe("positional-option", () => {
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
  })

  it("звичайні варіанти і keepOrder проходять", () => {
    expect(lintQuestion(choice(["1", "2", "3", "4", "5"]))).toEqual([])
    expect(lintQuestion(choice(["1", "2", "3", "4", "усі перелічені"], true))).toEqual([])
  })
})
