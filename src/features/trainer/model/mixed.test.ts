import { describe, expect, it } from "vitest"

import { DEFAULT_PROFILE } from "./exam/registry"
import { composeMixed, globalTag, splitGlobalTag, type MixedSource } from "./mixed"
import type { RenderedQuestion } from "./question/registry"

const choice = (index: number, tag = "a"): RenderedQuestion => ({
  index,
  type: "choice",
  level: 1,
  tag,
  q: `q${index}`,
  why: "w",
  options: ["1", "2", "3", "4", "5"],
  answer: 0,
  keepOrder: true,
})
const short = (index: number): RenderedQuestion => ({
  index,
  type: "short",
  level: 2,
  tag: "a",
  q: `s${index}`,
  why: "w",
  answer: 1,
})

const profile = (mixed: Record<string, number>) => ({ ...DEFAULT_PROFILE, mixed })

const source = (id: string, questions: RenderedQuestion[]): MixedSource => ({
  id,
  title: `Тема ${id}`,
  trainer: { exam: DEFAULT_PROFILE.id, tags: { a: "Правило A", b: "Правило B" }, questions },
})

describe("composeMixed", () => {
  it("бере завдання порівну з тем, лише типи зі складу, і не більше ліміту", () => {
    const sources = [
      source("x", [choice(0), choice(1), choice(2), short(3)]),
      source("y", [choice(0), short(1)]),
    ]
    const mixed = composeMixed(sources, profile({ choice: 3, short: 1 }), () => 0)
    expect(mixed.questions).toHaveLength(4)
    const byTopic = (type: string) =>
      mixed.questions.filter((q) => q.type === type).map((q) => q.topic)
    expect(byTopic("choice").sort()).toEqual(["x", "x", "y"])
    expect(byTopic("short")).toHaveLength(1)
  })

  it("теги глобальні, підписи — з назвою теми, лише вжиті; id лишається з практики", () => {
    const mixed = composeMixed(
      [source("x", [choice(0, "a"), choice(1, "b")])],
      profile({ choice: 1 }),
      () => 0
    )
    const [q] = mixed.questions
    expect(q.tag).toBe(globalTag("x", q.tag.endsWith("a") ? "a" : "b"))
    expect(Object.keys(mixed.tags)).toEqual([q.tag])
    expect(mixed.tags[q.tag]).toMatch(/^Тема x: Правило [AB]$/)
    expect([0, 1]).toContain(q.index)
    expect(mixed.exam).toBe(DEFAULT_PROFILE.id)
  })

  it("порожній банк чи тип поза складом — порожній тест", () => {
    expect(composeMixed([], DEFAULT_PROFILE, () => 0).questions).toEqual([])
    const onlyMulti: RenderedQuestion = {
      index: 0,
      type: "multi",
      level: 1,
      tag: "a",
      q: "q",
      why: "w",
      options: ["1", "2", "3"],
      answer: [0, 1],
      keepOrder: false,
    }
    expect(composeMixed([source("x", [onlyMulti])], DEFAULT_PROFILE, () => 0).questions).toEqual([])
  })

  it("глобальний тег розбирається назад", () => {
    expect(splitGlobalTag("math/number-sets/classify")).toEqual({
      topicId: "math/number-sets",
      tag: "classify",
    })
    expect(splitGlobalTag("classify")).toBeNull()
  })
})
