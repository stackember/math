import { describe as group, expect, it } from "vitest"

import { describe, href, pairOf } from "./topics"

group("topics", () => {
  it("розпізнає теорію й практику", () => {
    expect(describe("theory/modulus")).toEqual({ section: "theory", slug: "modulus" })
    expect(describe("practice/number-sets")).toEqual({ section: "practice", slug: "number-sets" })
  })

  it("інші сторінки — не теми", () => {
    expect(describe("index")).toEqual({ section: null })
    expect(describe("theory/numbers/sets")).toEqual({ section: null })
  })

  it("знаходить пару і посилання", () => {
    expect(pairOf("theory", "modulus")).toBe("practice/modulus")
    expect(pairOf("practice", "modulus")).toBe("theory/modulus")
    expect(href("theory/modulus")).toBe("/theory/modulus/")
  })
})
