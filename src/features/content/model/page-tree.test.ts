import type * as PageTree from "fumadocs-core/page-tree"
import { describe, expect, it } from "vitest"

import { PRACTICE_MENU_NAME, simplifyTree, THEORY_MENU_NAME } from "./page-tree"

const page = (url: string, name = url): PageTree.Item => ({ type: "page", name, url })

const folder = (
  name: string,
  index: PageTree.Item | undefined,
  children: PageTree.Node[]
): PageTree.Folder => ({ type: "folder", name, index, children })

describe("simplifyTree", () => {
  it("тема без практики стає звичайним пунктом меню", () => {
    const tree = [folder("Модуль числа", page("/math/numbers/modulus"), [])]
    expect(simplifyTree(tree)).toEqual([page("/math/numbers/modulus")])
  })

  it("тема з практикою лише розгортається: усередині «Теорія» і «Практика»", () => {
    const theory = page("/math/numbers/number-sets", "Числові множини")
    const practice = page("/math/numbers/number-sets/practice", "Практика: числові множини")
    const tree = [folder("Числові множини", theory, [practice])]
    expect(simplifyTree(tree)).toEqual([
      {
        ...folder("Числові множини", undefined, [
          { ...theory, name: THEORY_MENU_NAME },
          { ...practice, name: PRACTICE_MENU_NAME },
        ]),
        index: undefined,
      },
    ])
  })

  it("предмет (root): огляд лишається першим пунктом, у кінці — змішаний тест і прогрес", () => {
    // Fumadocs не робить index.mdx кореневої папки її `index`, а кладе першою сторінкою
    const overview = page("/math", "Математика")
    const theory = page("/math/numbers/modulus", "Модуль числа")
    const section = folder("Числа", undefined, [theory])
    const subject: PageTree.Folder = { ...folder("Математика", undefined, [overview, section]), root: true }
    const [result] = simplifyTree([subject]) as PageTree.Folder[]
    expect(result.children.map((c) => (c.type === "page" ? c.url : c.type))).toEqual([
      "/math",
      "folder",
      "separator",
      "/math/test",
      "/math/progress",
    ])
  })

  it("підсторінки теми лишаються після теорії", () => {
    const theory = page("/math/numbers/fractions", "Дроби")
    const sub = page("/math/numbers/fractions/periodic", "Періодичні дроби")
    const [topic] = simplifyTree([folder("Дроби", theory, [sub])]) as PageTree.Folder[]
    expect(topic.index).toBeUndefined()
    expect(topic.children.map((c) => c.name)).toEqual([THEORY_MENU_NAME, "Періодичні дроби"])
  })

  it("обробляє вкладені розділи й не чіпає роздільники", () => {
    const separator: PageTree.Separator = { type: "separator", name: "Числа" }
    const tree = [
      folder("Числа", undefined, [separator, folder("Модуль числа", page("/math/numbers/modulus"), [])]),
    ]
    expect(simplifyTree(tree)).toEqual([
      folder("Числа", undefined, [separator, page("/math/numbers/modulus")]),
    ])
  })
})
