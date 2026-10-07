import { describe, expect, it } from "vitest"

import { answerHtml } from "./answer-text"
import type { RenderedQuestion } from "./question/registry"

const common = { id: 0, level: 1 as const, tag: "t", q: "q", why: "why" }

describe("answerHtml", () => {
  it("вибір: літера відповідає показаному порядку, а не індексу", () => {
    const question: RenderedQuestion = {
      ...common,
      type: "choice",
      options: ["нуль", "один", "два", "три", "чотири"],
      answer: 0,
      keepOrder: false,
    }
    // варіант з індексом 0 показано другим → літера Б
    expect(answerHtml({ question, order: [2, 0, 1, 3, 4] })).toBe("Б) нуль")
  })

  it("відповідність: пари «рядок–літера» у фіксованому порядку", () => {
    const question: RenderedQuestion = {
      ...common,
      type: "match",
      left: ["1", "2", "3"],
      right: ["А", "Б", "В", "Г", "Д"],
      answer: [4, 0, 2],
    }
    expect(answerHtml({ question, order: [] })).toBe("1–Д, 2–А, 3–В")
  })

  it("коротка відповідь: число як у підручнику", () => {
    const question: RenderedQuestion = { ...common, type: "short", answer: -2.5 }
    expect(answerHtml({ question, order: [] })).toBe("−2,5")
  })
})
