import { describe, expect, it } from "vitest"

import { overview, type TopicInfo } from "./overview"
import { EMPTY_PROGRESS, type Progress } from "./progress"

const topic = (id: string, tags: Record<string, string>): TopicInfo => ({
  id,
  title: `Тема ${id}`,
  url: `/numbers/${id}/practice`,
  tags,
  total: 10,
})

const progress = (partial: Partial<Progress>): Progress => ({ ...EMPTY_PROGRESS, ...partial })

describe("overview", () => {
  it("тема без записів — порожній прогрес і нулі за правилами", () => {
    const result = overview([topic("x", { a: "A" })], () => EMPTY_PROGRESS, "mixed/p")
    expect(result.topics[0].rules).toEqual([{ tag: "a", label: "A", correct: 0, total: 0 }])
    expect(result.started).toBe(0)
    expect(result.attempts).toBe(0)
    expect(result.weak).toEqual([])
  })

  it("зливає статистику практики і змішаного тесту за глобальним тегом, рахує слабкі правила", () => {
    const stored: Record<string, Progress> = {
      x: progress({
        last: { score: 7, total: 10 },
        attempts: [{ score: 7, total: 10, tags: {}, at: 1 }],
        tags: { a: { correct: 1, total: 4 }, b: { correct: 3, total: 3 } },
      }),
      "mixed/p": progress({
        tags: { "x/a": { correct: 2, total: 2 }, "y/b": { correct: 0, total: 2 } },
      }),
    }
    const result = overview(
      [topic("x", { a: "A", b: "B" }), topic("y", { b: "B" })],
      (id) => stored[id] ?? EMPTY_PROGRESS,
      "mixed/p"
    )
    expect(result.topics[0].rules).toEqual([
      { tag: "a", label: "A", correct: 3, total: 6 },
      { tag: "b", label: "B", correct: 3, total: 3 },
    ])
    expect(result.topics[1].rules).toEqual([{ tag: "b", label: "B", correct: 0, total: 2 }])
    expect(result.weak.map((r) => [r.topic.id, r.tag])).toEqual([
      ["y", "b"],
      ["x", "a"],
    ])
    expect(result.started).toBe(1)
    expect(result.attempts).toBe(1)
    expect(result.mixed).toBe(stored["mixed/p"])
  })

  it("правило з однією відповіддю ще не слабке", () => {
    const result = overview(
      [topic("x", { a: "A" })],
      () => progress({ tags: { a: { correct: 0, total: 1 } } }),
      "mixed/p"
    )
    expect(result.weak).toEqual([])
  })
})
