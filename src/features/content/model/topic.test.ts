import { describe, expect, it } from "vitest"

import {
  isPractice,
  isPracticeUrl,
  isStrayPage,
  practiceFile,
  practiceSlugs,
  subjectIndex,
  theoryFile,
  theorySlugs,
  topicId,
  topicOf,
  topicPage,
  urlOf,
} from "./topic"

const topic = { subject: "math", area: "numbers", slug: "number-sets" }

describe("topicOf", () => {
  it("розпізнає теорію, підсторінку й практику однієї теми", () => {
    expect(topicOf(["math", "numbers", "number-sets"])).toEqual(topic)
    expect(topicOf(["math", "numbers", "number-sets", "periodic-fractions"])).toEqual(topic)
    expect(topicOf(["math", "numbers", "number-sets", "practice"])).toEqual(topic)
    expect(topicId(topic)).toBe("math/number-sets")
  })

  it("головна, предмет, розділ і глибші шляхи — не теми", () => {
    expect(topicOf([])).toBeNull()
    expect(topicOf(["math"])).toBeNull()
    expect(topicOf(["math", "numbers"])).toBeNull()
    expect(topicOf(["math", "numbers", "number-sets", "deep", "page"])).toBeNull()
  })
})

describe("isPractice / пара", () => {
  it("практика — лише practice.mdx у папці теми", () => {
    expect(isPractice(["math", "numbers", "number-sets", "practice"])).toBe(true)
    expect(isPractice(["math", "numbers", "number-sets"])).toBe(false)
    expect(isPractice(["math", "numbers", "practice"])).toBe(false)
    expect(isPracticeUrl("/math/numbers/number-sets/practice")).toBe(true)
    expect(isPracticeUrl("/math/numbers/number-sets")).toBe(false)
  })

  it("знаходить сусідній файл", () => {
    expect(theorySlugs(topic)).toEqual(["math", "numbers", "number-sets"])
    expect(practiceSlugs(topic)).toEqual(["math", "numbers", "number-sets", "practice"])
    expect(theoryFile(topic)).toBe("math/numbers/number-sets/index.mdx")
    expect(practiceFile(topic)).toBe("math/numbers/number-sets/practice.mdx")
  })
})

describe("файли", () => {
  it("розпізнає роль файлу за шляхом відносно content/", () => {
    expect(topicPage("math/numbers/number-sets/index.mdx")).toEqual({ topic, kind: "theory" })
    expect(topicPage("math/numbers/number-sets/practice.mdx")).toEqual({ topic, kind: "practice" })
    expect(topicPage("math\\numbers\\number-sets\\extra.mdx")).toEqual({ topic, kind: "subpage" })
    expect(topicPage("math/numbers/number-sets/figures/x.svg")).toBeNull()
    expect(topicPage("index.mdx")).toBeNull()
    expect(topicPage("math/index.mdx")).toBeNull()
    expect(topicPage("math/numbers/meta.json")).toBeNull()
    expect(topicPage("math/numbers/number-sets/deep/page.mdx")).toBeNull()
  })

  it("огляд предмета і сторінки не на своєму місці", () => {
    expect(subjectIndex("math/index.mdx")).toBe("math")
    expect(subjectIndex("math/numbers/index.mdx")).toBeNull()
    expect(isStrayPage("math/numbers/modulus.mdx")).toBe(true)
    expect(isStrayPage("math/intro.mdx")).toBe(true)
    expect(isStrayPage("math/index.mdx")).toBe(false)
    expect(isStrayPage("math/numbers/meta.json")).toBe(false)
    expect(isStrayPage("index.mdx")).toBe(false)
  })

  it("адреса сторінки за файлом", () => {
    expect(urlOf("index.mdx")).toBe("/")
    expect(urlOf("math/index.mdx")).toBe("/math")
    expect(urlOf("math/numbers/modulus/index.mdx")).toBe("/math/numbers/modulus")
    expect(urlOf("math/numbers/modulus/practice.mdx")).toBe("/math/numbers/modulus/practice")
    expect(urlOf("math/numbers/modulus/extra.md")).toBe("/math/numbers/modulus/extra")
  })
})
