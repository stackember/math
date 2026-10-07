import type * as PageTree from "fumadocs-core/page-tree"
import { describe, expect, it } from "vitest"

import { orderPracticeLikeTheory, pairSlugs, topicOf } from "./topics"

const page = (url: string): PageTree.Item => ({ type: "page", name: url, url })

const folder = (name: string, urls: string[]): PageTree.Folder => ({
  type: "folder",
  name,
  children: urls.map(page),
})

const tree = (theory: string[], practice: string[]): PageTree.Root => ({
  name: "root",
  children: [
    page("/"),
    folder(
      "Теорія",
      theory.map((slug) => `/theory/${slug}`)
    ),
    folder(
      "Практика",
      practice.map((slug) => `/practice/${slug}`)
    ),
  ],
})

const practiceUrls = (root: PageTree.Root) =>
  (root.children[2] as PageTree.Folder).children.map((node) => (node as PageTree.Item).url)

describe("topicOf / pairSlugs", () => {
  it("розпізнає теорію й практику", () => {
    expect(topicOf(["theory", "modulus"])).toEqual({ section: "theory", slug: "modulus" })
    expect(topicOf(["practice", "number-sets"])).toEqual({
      section: "practice",
      slug: "number-sets",
    })
  })

  it("інші сторінки — не теми", () => {
    expect(topicOf([])).toBeNull()
    expect(topicOf(["theory"])).toBeNull()
    expect(topicOf(["theory", "numbers", "sets"])).toBeNull()
  })

  it("знаходить пару", () => {
    expect(pairSlugs({ section: "theory", slug: "modulus" })).toEqual(["practice", "modulus"])
    expect(pairSlugs({ section: "practice", slug: "modulus" })).toEqual(["theory", "modulus"])
  })
})

describe("orderPracticeLikeTheory", () => {
  it("ставить практику в порядку теорії", () => {
    const root = tree(["sets", "modulus", "integers"], ["integers", "sets", "modulus"])
    expect(practiceUrls(orderPracticeLikeTheory(root))).toEqual([
      "/practice/sets",
      "/practice/modulus",
      "/practice/integers",
    ])
  })

  it("не змінює вхідне дерево", () => {
    const root = tree(["a", "b"], ["b", "a"])
    orderPracticeLikeTheory(root)
    expect(practiceUrls(root)).toEqual(["/practice/b", "/practice/a"])
  })

  it("дерево без практики повертає як є", () => {
    const root: PageTree.Root = { name: "root", children: [folder("Теорія", ["/theory/a"])] }
    expect(orderPracticeLikeTheory(root)).toBe(root)
  })

  it("практика без теорії — помилка з поясненням", () => {
    const root = tree(["sets"], ["sets", "modulus"])
    expect(() => orderPracticeLikeTheory(root)).toThrow(/Практика «modulus» не має теорії/)
  })
})
