import { describe, expect, it } from "vitest"

import {
  ATTEMPTS_KEPT,
  createProgressStore,
  EMPTY_PROGRESS,
  type KeyValueStorage,
} from "./progress"

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

const clock = (start = 1000) => {
  let t = start
  return () => (t += 1)
}

describe("createProgressStore", () => {
  it("порожнє сховище — порожній прогрес; запис дає best, last, історію і теги", () => {
    const storage = memory()
    const store = createProgressStore(() => storage, clock())
    expect(store.load("t")).toEqual(EMPTY_PROGRESS)

    const saved = store.save("t", result(3))
    expect(saved).toEqual({
      version: 3,
      best: { score: 3, total: 5 },
      last: { score: 3, total: 5 },
      attempts: [{ ...result(3), at: 1001 }],
      tags: { a: { correct: 3, total: 5 } },
    })
    expect(JSON.parse(storage.getItem("trainer:t") ?? "")).toEqual(saved)
  })

  it("гірший результат оновлює last, теги накопичуються, історія росте", () => {
    const storage = memory()
    const store = createProgressStore(() => storage, clock())
    store.save("t", result(5))
    const saved = store.save("t", result(2))
    expect(saved.best).toEqual({ score: 5, total: 5 })
    expect(saved.last).toEqual({ score: 2, total: 5 })
    expect(saved.tags).toEqual({ a: { correct: 7, total: 10 } })
    expect(saved.attempts.map((a) => [a.at, a.score])).toEqual([
      [1001, 5],
      [1002, 2],
    ])
  })

  it("історія обмежена останніми проходами", () => {
    const storage = memory()
    const store = createProgressStore(() => storage, clock())
    let saved = store.load("t")
    for (let i = 0; i < ATTEMPTS_KEPT + 3; i++) saved = store.save("t", result(i % 6))
    expect(saved.attempts).toHaveLength(ATTEMPTS_KEPT)
    expect(saved.attempts.at(-1)?.at).toBe(1000 + ATTEMPTS_KEPT + 3)
  })

  it("читає записи версій 1 і 2 (і старий ключ), історії в них немає", () => {
    const v1 = JSON.stringify({ best: { score: 4, total: 5 }, last: { score: 1, total: 5 } })
    expect(createProgressStore(() => memory({ "trainer:practice/t": v1 })).load("t")).toEqual({
      version: 3,
      best: { score: 4, total: 5 },
      last: { score: 1, total: 5 },
      attempts: [],
      tags: {},
    })

    const v2 = JSON.stringify({
      version: 2,
      best: { score: 4, total: 5 },
      last: { score: 4, total: 5 },
      tags: { a: { correct: 4, total: 5 } },
    })
    expect(createProgressStore(() => memory({ "trainer:t": v2 })).load("t")).toEqual({
      version: 3,
      best: { score: 4, total: 5 },
      last: { score: 4, total: 5 },
      attempts: [],
      tags: { a: { correct: 4, total: 5 } },
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
