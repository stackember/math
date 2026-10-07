import { describe, expect, it } from "vitest"

import { createProgressStore, EMPTY_PROGRESS, type KeyValueStorage } from "./progress"

const memory = (initial: Record<string, string> = {}): KeyValueStorage => {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  }
}

const result = (score: number, total = 5) => ({
  score,
  total,
  tags: { a: { correct: score, total } },
})

describe("createProgressStore", () => {
  it("порожнє сховище — порожній прогрес; запис дає best, last і теги", () => {
    const storage = memory()
    const store = createProgressStore(() => storage)
    expect(store.load("t")).toEqual(EMPTY_PROGRESS)

    const saved = store.save("t", result(3))
    expect(saved).toEqual({
      version: 2,
      best: { score: 3, total: 5 },
      last: { score: 3, total: 5 },
      tags: { a: { correct: 3, total: 5 } },
    })
    expect(JSON.parse(storage.getItem("trainer:t") ?? "")).toEqual(saved)
  })

  it("гірший результат оновлює last, теги накопичуються", () => {
    const storage = memory()
    const store = createProgressStore(() => storage)
    store.save("t", result(5))
    const saved = store.save("t", result(2))
    expect(saved.best).toEqual({ score: 5, total: 5 })
    expect(saved.last).toEqual({ score: 2, total: 5 })
    expect(saved.tags).toEqual({ a: { correct: 7, total: 10 } })
  })

  it("читає запис версії 1 і старий ключ, якщо за новим ще нічого немає", () => {
    const v1 = JSON.stringify({ best: { score: 4, total: 5 }, last: { score: 1, total: 5 } })
    const store = createProgressStore(() => memory({ "trainer:practice/t": v1 }))
    expect(store.load("t")).toEqual({
      version: 2,
      best: { score: 4, total: 5 },
      last: { score: 1, total: 5 },
      tags: {},
    })
  })

  it("зіпсований запис і недоступне сховище — як порожній прогрес, без помилок", () => {
    const broken = createProgressStore(() => memory({ "trainer:t": "{не json" }))
    expect(broken.load("t")).toEqual(EMPTY_PROGRESS)

    const unavailable = createProgressStore(() => {
      throw new Error("SecurityError")
    })
    expect(unavailable.load("t")).toEqual(EMPTY_PROGRESS)
    expect(unavailable.save("t", result(5)).best).toEqual({ score: 5, total: 5 })
  })
})
