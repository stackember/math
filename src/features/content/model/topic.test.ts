import { describe, expect, it } from "vitest"

import { isPractice, practiceSlugs, theorySlugs, topicOf } from "./topic"

describe("topicOf", () => {
  it("розпізнає теорію, підсторінку й практику однієї теми", () => {
    const topic = { area: "numbers", slug: "number-sets" }
    expect(topicOf(["numbers", "number-sets"])).toEqual(topic)
    expect(topicOf(["numbers", "number-sets", "periodic-fractions"])).toEqual(topic)
    expect(topicOf(["numbers", "number-sets", "practice"])).toEqual(topic)
  })

  it("головна, розділ і глибші шляхи — не теми", () => {
    expect(topicOf([])).toBeNull()
    expect(topicOf(["numbers"])).toBeNull()
    expect(topicOf(["numbers", "number-sets", "deep", "page"])).toBeNull()
  })
})

describe("isPractice / пара", () => {
  it("практика — лише practice.mdx у папці теми", () => {
    expect(isPractice(["numbers", "number-sets", "practice"])).toBe(true)
    expect(isPractice(["numbers", "number-sets"])).toBe(false)
    expect(isPractice(["numbers", "practice"])).toBe(false)
  })

  it("знаходить сусідній файл", () => {
    const topic = { area: "numbers", slug: "modulus" }
    expect(theorySlugs(topic)).toEqual(["numbers", "modulus"])
    expect(practiceSlugs(topic)).toEqual(["numbers", "modulus", "practice"])
  })
})
