import { describe, expect, it } from "vitest"

import { orderByLevel, shuffle } from "./order"

describe("shuffle", () => {
  it("зберігає всі елементи і не змінює вхідний масив", () => {
    const items = [1, 2, 3, 4, 5]
    const result = shuffle(items, () => 0.5)
    expect([...result].sort()).toEqual(items)
    expect(items).toEqual([1, 2, 3, 4, 5])
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
