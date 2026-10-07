import { describe, expect, it } from "vitest"

import {
  isPractice,
  isPracticeUrl,
  isStrayPage,
  practiceFile,
  practiceSlugs,
  theoryFile,
  theorySlugs,
  topicOf,
  topicPage,
  urlOf,
} from "./topic"

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
    expect(isPracticeUrl("/numbers/number-sets/practice")).toBe(true)
    expect(isPracticeUrl("/numbers/number-sets")).toBe(false)
  })

  it("знаходить сусідній файл", () => {
    const topic = { area: "numbers", slug: "modulus" }
    expect(theorySlugs(topic)).toEqual(["numbers", "modulus"])
    expect(practiceSlugs(topic)).toEqual(["numbers", "modulus", "practice"])
    expect(theoryFile(topic)).toBe("numbers/modulus/index.mdx")
    expect(practiceFile(topic)).toBe("numbers/modulus/practice.mdx")
  })
})

describe("файли теми", () => {
  it("розпізнає роль файлу за шляхом відносно content/", () => {
    const topic = { area: "numbers", slug: "modulus" }
    expect(topicPage("numbers/modulus/index.mdx")).toEqual({ topic, kind: "theory" })
    expect(topicPage("numbers/modulus/practice.mdx")).toEqual({ topic, kind: "practice" })
    expect(topicPage("numbers\\modulus\\extra.mdx")).toEqual({ topic, kind: "subpage" })
    expect(topicPage("numbers/modulus/figures/x.svg")).toBeNull()
    expect(topicPage("index.mdx")).toBeNull()
    expect(topicPage("numbers/meta.json")).toBeNull()
    expect(topicPage("numbers/modulus/deep/page.mdx")).toBeNull()
  })

  it("сторінка просто в розділі — поза угодою", () => {
    expect(isStrayPage("numbers/modulus.mdx")).toBe(true)
    expect(isStrayPage("numbers/meta.json")).toBe(false)
    expect(isStrayPage("index.mdx")).toBe(false)
  })

  it("адреса сторінки за файлом", () => {
    expect(urlOf("index.mdx")).toBe("/")
    expect(urlOf("numbers/modulus/index.mdx")).toBe("/numbers/modulus")
    expect(urlOf("numbers/modulus/practice.mdx")).toBe("/numbers/modulus/practice")
    expect(urlOf("numbers/modulus/extra.md")).toBe("/numbers/modulus/extra")
  })
})
