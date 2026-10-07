import type * as PageTree from "fumadocs-core/page-tree"
import type { LoaderPlugin } from "fumadocs-core/source"

import { isPracticeUrl } from "./topic"

/** Пункти меню всередині теми (повні назви лишаються в заголовках сторінок і у вкладці). */
export const THEORY_MENU_NAME = "Теорія"
export const PRACTICE_MENU_NAME = "Практика"

/**
 * Меню: назва теми лише розгортає її, а всередині — «Теорія», «Практика» й підсторінки.
 * Інакше Fumadocs робить назву теми посиланням на теорію, і на телефоні тап веде на сторінку
 * й закриває меню, не показавши практику. Тема без практики й підсторінок — звичайний пункт.
 */
export function simplifyTree(nodes: PageTree.Node[]): PageTree.Node[] {
  return nodes.map((node) => {
    if (node.type === "page") {
      return isPracticeUrl(node.url) ? { ...node, name: PRACTICE_MENU_NAME } : node
    }
    if (node.type !== "folder") return node

    const children = simplifyTree(node.children)
    if (!node.index) return { ...node, children }
    if (children.length === 0) return node.index
    return {
      ...node,
      index: undefined,
      children: [{ ...node.index, name: THEORY_MENU_NAME }, ...children],
    }
  })
}

/** Сторінки поза контентом — у кінці меню після роздільника (маршрути в src/app/). */
const EXTRA_PAGES: PageTree.Node[] = [
  { type: "separator", name: "Усі теми" },
  { type: "page", name: "Змішаний тест", url: "/test" },
  { type: "page", name: "Прогрес", url: "/progress" },
]

const simplifyRoot = (root: PageTree.Root): PageTree.Root => ({
  ...root,
  children: [...simplifyTree(root.children), ...EXTRA_PAGES],
})

export function pageTreePlugin(): LoaderPlugin {
  return {
    name: "page-tree",
    transformPageTree: { root: simplifyRoot },
  }
}
