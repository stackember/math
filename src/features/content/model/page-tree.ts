import type * as PageTree from "fumadocs-core/page-tree"
import type { LoaderPlugin } from "fumadocs-core/source"

import { isPracticeUrl, slugsOfUrl } from "./topic"

/** Пункти меню всередині теми (повні назви лишаються в заголовках сторінок і у вкладці). */
export const THEORY_MENU_NAME = "Теорія"
export const PRACTICE_MENU_NAME = "Практика"

/** Сторінки предмета поза контентом — у кінці його меню (маршрути src/app/[subject]/…). */
const subjectPages = (subject: string): PageTree.Node[] => [
  { type: "separator", name: "Усі теми" },
  { type: "page", name: "Змішаний тест", url: `/${subject}/test` },
  { type: "page", name: "Прогрес", url: `/${subject}/progress` },
]

/**
 * Меню: назва теми лише розгортає її, а всередині — «Теорія», «Практика» й підсторінки.
 * Інакше Fumadocs робить назву теми посиланням на теорію, і на телефоні тап веде на сторінку
 * й закриває меню, не показавши практику. Тема без практики й підсторінок — звичайний пункт.
 * Предмет (`root`) не чіпаємо: його index.mdx — огляд, а в кінці — змішаний тест і прогрес.
 */
export function simplifyTree(nodes: PageTree.Node[]): PageTree.Node[] {
  return nodes.map((node) => {
    if (node.type === "page") {
      return isPracticeUrl(node.url) ? { ...node, name: PRACTICE_MENU_NAME } : node
    }
    if (node.type !== "folder") return node

    const children = simplifyTree(node.children)
    if (node.root) {
      const subject = node.index && slugsOfUrl(node.index.url)[0]
      return { ...node, children: subject ? [...children, ...subjectPages(subject)] : children }
    }
    if (!node.index) return { ...node, children }
    if (children.length === 0) return node.index
    return {
      ...node,
      index: undefined,
      children: [{ ...node.index, name: THEORY_MENU_NAME }, ...children],
    }
  })
}

const simplifyRoot = (root: PageTree.Root): PageTree.Root => ({
  ...root,
  children: simplifyTree(root.children),
})

export function pageTreePlugin(): LoaderPlugin {
  return {
    name: "page-tree",
    transformPageTree: { root: simplifyRoot },
  }
}
