import type * as PageTree from "fumadocs-core/page-tree"
import { describe, expect, it } from "vitest"

import { PRACTICE_MENU_NAME, simplifyTree } from "./page-tree"

const page = (url: string, name = url): PageTree.Item => ({ type: "page", name, url })

const folder = (
  name: string,
  index: PageTree.Item | undefined,
  children: PageTree.Node[]
): PageTree.Folder => ({ type: "folder", name, index, children })

describe("simplifyTree", () => {
  it("тема без практики стає звичайним пунктом меню", () => {
    const tree = [folder("Модуль числа", page("/numbers/modulus"), [])]
    expect(simplifyTree(tree)).toEqual([page("/numbers/modulus")])
  })

  it("практика всередині теми називається «Практика»", () => {
    const practice = page("/numbers/number-sets/practice", "Практика: числові множини")
    const tree = [folder("Числові множини", page("/numbers/number-sets"), [practice])]
    const [topic] = simplifyTree(tree)
    expect(topic.type).toBe("folder")
    expect((topic as PageTree.Folder).children).toEqual([
      { ...practice, name: PRACTICE_MENU_NAME },
    ])
  })

  it("обробляє вкладені розділи й не чіпає роздільники", () => {
    const separator: PageTree.Separator = { type: "separator", name: "Числа" }
    const tree = [
      folder("Числа", undefined, [separator, folder("Модуль числа", page("/numbers/modulus"), [])]),
    ]
    expect(simplifyTree(tree)).toEqual([
      folder("Числа", undefined, [separator, page("/numbers/modulus")]),
    ])
  })
})
