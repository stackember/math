import { describe, expect, it } from "vitest"

import { emptyDraft, formatNumber, isAnswered, isCorrect, orderByLevel, parseNumber } from "./check"
import type { Question } from "./schema"

const common = { level: 1 as const, tag: "t", q: "q", why: "why" }
const choice: Question = {
  ...common,
  type: "choice",
  options: ["a", "b", "c", "d", "e"],
  answer: 2,
  keepOrder: false,
}
const match: Question = {
  ...common,
  type: "match",
  left: ["1", "2", "3"],
  right: ["А", "Б", "В", "Г", "Д"],
  answer: [0, 1, 2],
}
const short: Question = { ...common, type: "short", answer: -2.5 }

describe("parseNumber", () => {
  it.each([
    ["4", 4],
    ["−2,5", -2.5],
    ["-2.5", -2.5],
    [" - 5 / 2 ", -2.5],
    ["0,75", 0.75],
  ])("%s → %d", (input, expected) => {
    expect(parseNumber(input)).toBe(expected)
  })

  it.each(["", "abc", "2,5,1", "1/0", "2.", "--3"])("«%s» — не число", (input) => {
    expect(parseNumber(input)).toBeNull()
  })
})

describe("formatNumber", () => {
  it("пише мінус і десяткову кому як у підручнику", () => {
    expect(formatNumber(-2.5)).toBe("−2,5")
    expect(formatNumber(4)).toBe("4")
  })
})

describe("isCorrect / isAnswered", () => {
  it("choice", () => {
    expect(isAnswered(emptyDraft(choice))).toBe(false)
    expect(isCorrect(choice, { type: "choice", choice: 2 })).toBe(true)
    expect(isCorrect(choice, { type: "choice", choice: 0 })).toBe(false)
  })

  it("match: правильно лише якщо всі рядки правильні", () => {
    expect(isAnswered({ type: "match", match: [0, null, 2] })).toBe(false)
    expect(isCorrect(match, { type: "match", match: [0, 1, 2] })).toBe(true)
    expect(isCorrect(match, { type: "match", match: [0, 2, 2] })).toBe(false)
  })

  it("short: приймає різні записи того самого числа", () => {
    expect(isCorrect(short, { type: "short", value: "−2,5" })).toBe(true)
    expect(isCorrect(short, { type: "short", value: "-5/2" })).toBe(true)
    expect(isCorrect(short, { type: "short", value: "2,5" })).toBe(false)
    expect(isCorrect(short, { type: "short", value: "abc" })).toBe(false)
  })
})

describe("orderByLevel", () => {
  it("іде від легких до складних і зберігає всі завдання", () => {
    const items = [3, 1, 2, 1, 3, 2].map((level, id) => ({ id, level: level as 1 | 2 | 3 }))
    const ordered = orderByLevel(items)
    expect(ordered.map((q) => q.level)).toEqual([1, 1, 2, 2, 3, 3])
    expect(ordered.map((q) => q.id).sort()).toEqual([0, 1, 2, 3, 4, 5])
  })
})
