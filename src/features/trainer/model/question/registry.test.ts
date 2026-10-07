import { parse } from "yaml"
import { describe, expect, it } from "vitest"

import { select } from "./choice"
import { pick } from "./match"
import { toggle } from "./multi"
import { moduleOf, QUESTION_MODULES, questionSchema, updateDraft, type Question } from "./registry"
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
const multi: Question = {
  ...common,
  type: "multi",
  options: ["a", "b", "c", "d", "e"],
  answer: [1, 3],
  keepOrder: false,
}

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
  it("цифра обирає варіант на показаній позиції, поза межами — нічого", () => {
    const update = m.digit?.(choice, [2, 0, 1, 3, 4], 1)
    expect(update?.({ type: "choice", choice: null })).toEqual({ type: "choice", choice: 2 })
    expect(m.digit?.(choice, [2, 0, 1, 3, 4], 6)).toBeNull()
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
  it("цифрою не відповідають", () => {
    expect(m.digit).toBeUndefined()
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

describe("multi", () => {
  const m = moduleOf(multi)
  it("зараховує лише повний збіг множини, у будь-якому порядку", () => {
    expect(m.isAnswered({ type: "multi", chosen: [] })).toBe(false)
    expect(m.isCorrect(multi, { type: "multi", chosen: [3, 1] })).toBe(true)
    expect(m.isCorrect(multi, { type: "multi", chosen: [1] })).toBe(false)
    expect(m.isCorrect(multi, { type: "multi", chosen: [1, 3, 0] })).toBe(false)
  })
  it("відповідь на бланку — літери правильних за показаним порядком", () => {
    expect(m.answerHtml(multi, [3, 4, 1, 0, 2])).toBe("А, В")
  })
  it("перемикання тримає індекси за зростанням; цифра перемикає показану позицію", () => {
    expect(toggle(3)({ type: "multi", chosen: [1] })).toEqual({ type: "multi", chosen: [1, 3] })
    expect(toggle(1)({ type: "multi", chosen: [1, 3] })).toEqual({ type: "multi", chosen: [3] })
    const update = m.digit?.(multi, [3, 4, 1, 0, 2], 2)
    expect(update?.({ type: "multi", chosen: [] })).toEqual({ type: "multi", chosen: [4] })
  })
  it("схема: не менше двох правильних, не всі, індекси в межах і без повторів; answer сортується", () => {
    const base = { ...common, type: "multi", options: ["a", "b", "c"] }
    const messages = (answer: number[]) => {
      const result = questionSchema.safeParse({ ...base, answer })
      return result.success ? [] : result.error.issues.map((i) => i.message)
    }
    expect(messages([2, 0])).toEqual([])
    expect(questionSchema.parse({ ...base, answer: [2, 0] })).toMatchObject({ answer: [0, 2] })
    expect(messages([1])[0]).toMatch(/щонайменше 2 правильних/)
    expect(messages([0, 1, 2])).toContainEqual(expect.stringMatching(/лиши хоч один хибний/))
    expect(messages([0, 3])).toContainEqual(expect.stringMatching(/індекси від 0 до 2/))
    expect(messages([0, 0])).toContainEqual(expect.stringMatching(/індекси повторюються/))
  })
  it("умова без «усі/всі/які з» — попередження, не помилка", () => {
    expect(m.lint?.(multi)).toEqual([expect.objectContaining({ severity: "warn" })])
    expect(m.lint?.({ ...multi, q: "Які з чисел ірраціональні?" })).toEqual([])
  })
})

describe("контракт кожного типу", () => {
  it.each(QUESTION_MODULES.map((m) => [m.type, m] as const))(
    "%s: приклад з meta валідний, еталонні чернетки правильна/неправильна",
    (type, module) => {
      const [parsed] = parse(module.meta.example) as unknown[]
      const result = questionSchema.safeParse(parsed)
      expect(result.success, JSON.stringify(result.error?.issues)).toBe(true)
      if (!result.success) return
      const question = result.data
      expect(question.type).toBe(type)

      const m = moduleOf(question)
      const correct = m.correctDraft(question)
      const wrong = m.wrongDraft(question)
      expect(correct.type).toBe(type)
      expect(m.isAnswered(correct)).toBe(true)
      expect(m.invalidReason(correct)).toBeNull()
      expect(m.isCorrect(question, correct)).toBe(true)
      expect(m.isAnswered(wrong)).toBe(true)
      expect(m.invalidReason(wrong)).toBeNull()
      expect(m.isCorrect(question, wrong)).toBe(false)
      expect(m.isAnswered(m.emptyDraft(question))).toBe(false)
    }
  )

  it("невідомий type — повідомлення перелічує всі типи з реєстру", () => {
    const result = questionSchema.safeParse({ ...common, type: "essay" })
    expect(result.success).toBe(false)
    const message = result.error?.issues[0]?.message ?? ""
    for (const m of QUESTION_MODULES) expect(message).toContain(`${m.type} (${m.meta.label})`)
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
