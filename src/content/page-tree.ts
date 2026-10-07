import type * as PageTree from "fumadocs-core/page-tree"
import type { LoaderPlugin } from "fumadocs-core/source"

import { PRACTICE } from "./topic"

/** Пункт практики в меню (повна назва лишається в заголовку сторінки й у вкладці). */
export const PRACTICE_MENU_NAME = "Практика"

const isPracticeUrl = (url: string) => url.endsWith(`/${PRACTICE}`)

/**
 * Меню: тема без практики й підсторінок — звичайний пункт, а не папка з однією сторінкою;
 * практика всередині теми називається коротко «Практика».
 */
export function simplifyTree(nodes: PageTree.Node[]): PageTree.Node[] {
  return nodes.map((node) => {
    if (node.type === "page") {
      return isPracticeUrl(node.url) ? { ...node, name: PRACTICE_MENU_NAME } : node
    }
    if (node.type !== "folder") return node

    const children = simplifyTree(node.children)
    if (node.index && children.length === 0) return node.index
    return { ...node, children }
  })
}

export const simplifyRoot = (root: PageTree.Root): PageTree.Root => ({
  ...root,
  children: simplifyTree(root.children),
})

export function pageTreePlugin(): LoaderPlugin {
  return {
    name: "page-tree",
    transformPageTree: { root: simplifyRoot },
  }
}
