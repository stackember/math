import { describe, expect, it } from "vitest"

import { select } from "./choice"
import { pick } from "./match"
import { moduleOf, updateDraft, type Question } from "./registry"
import { input } from "./short"

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

describe("choice", () => {
  const m = moduleOf(choice)
  it("порожня чернетка не відповідь; правильно — лише свій індекс", () => {
    expect(m.isAnswered(m.emptyDraft(choice))).toBe(false)
    expect(m.isCorrect(choice, { type: "choice", choice: 2 })).toBe(true)
    expect(m.isCorrect(choice, { type: "choice", choice: 0 })).toBe(false)
  })
  it("перемішує варіанти, крім keepOrder", () => {
    expect([...m.displayOrder(choice, () => 0.99)].sort()).toEqual([0, 1, 2, 3, 4])
    expect(m.displayOrder({ ...choice, keepOrder: true }, Math.random)).toEqual([0, 1, 2, 3, 4])
  })
  it("відповідь на бланку — літера за показаним порядком", () => {
    expect(m.answerHtml(choice, [2, 0, 1, 3, 4])).toBe("А) c")
  })
})

describe("match", () => {
  const m = moduleOf(match)
  it("правильно лише якщо всі рядки правильні", () => {
    expect(m.isAnswered({ type: "match", match: [0, null, 2] })).toBe(false)
    expect(m.isCorrect(match, { type: "match", match: [0, 1, 2] })).toBe(true)
    expect(m.isCorrect(match, { type: "match", match: [0, 2, 2] })).toBe(false)
    expect(m.answerHtml(match, [])).toBe("1–А, 2–Б, 3–В")
  })
})

describe("short", () => {
  const m = moduleOf(short)
  it("приймає різні записи того самого числа, не число — пояснює", () => {
    expect(m.isCorrect(short, { type: "short", value: "−2,5" })).toBe(true)
    expect(m.isCorrect(short, { type: "short", value: "-5/2" })).toBe(true)
    expect(m.isCorrect(short, { type: "short", value: "2,5" })).toBe(false)
    expect(m.invalidReason({ type: "short", value: "abc" })).toMatch(/Введи число/)
    expect(m.invalidReason({ type: "short", value: "4" })).toBeNull()
    expect(m.answerHtml(short, [])).toBe("−2,5")
  })
})

describe("updateDraft", () => {
  it("застосовує оновлення лише до чернетки свого типу", () => {
    expect(updateDraft("choice", select(3))({ type: "choice", choice: null })).toEqual({
      type: "choice",
      choice: 3,
    })
    expect(updateDraft("choice", select(3))({ type: "short", value: "" })).toEqual({
      type: "short",
      value: "",
    })
    expect(updateDraft("match", pick(1, 4))({ type: "match", match: [0, null, null] })).toEqual({
      type: "match",
      match: [0, 4, null],
    })
    expect(updateDraft("short", input("7"))({ type: "short", value: "" })).toEqual({
      type: "short",
      value: "7",
    })
  })
})
