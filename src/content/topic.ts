import type * as PageTree from "fumadocs-core/page-tree"
import type { LoaderPlugin } from "fumadocs-core/source"

/**
 * Угоди про сторінки (slugs у Fumadocs):
 *   theory/<slug>    — теорія теми
 *   practice/<slug>  — практика (тренажер) до теми з тим самим <slug>
 * Порядок тем задає content/theory/meta.json; практика стає в той самий порядок автоматично.
 */
export type Section = "theory" | "practice"

export interface Topic {
  section: Section
  slug: string
}

/** Тема сторінки за її slugs, або `null` для інших сторінок (головна тощо). */
export function topicOf(slugs: readonly string[]): Topic | null {
  const [section, slug, ...rest] = slugs
  if ((section === "theory" || section === "practice") && slug && rest.length === 0) {
    return { section, slug }
  }
  return null
}

/** Для теорії — slugs її практики, для практики — slugs її теорії. */
export function pairSlugs({ section, slug }: Topic): string[] {
  return [section === "theory" ? "practice" : "theory", slug]
}

const topicOfUrl = (url: string) => topicOf(url.split("/").filter(Boolean))

const topicOfNode = (node: PageTree.Node) => (node.type === "page" ? topicOfUrl(node.url) : null)

function sectionFolder(root: PageTree.Root, section: Section): PageTree.Folder | undefined {
  return root.children.find(
    (node): node is PageTree.Folder =>
      node.type === "folder" &&
      node.children.some((child) => topicOfNode(child)?.section === section)
  )
}

/**
 * Ставить пункти практики в меню в тому ж порядку, що й теми теорії.
 * Практика, для якої немає теорії в меню, — помилка: збирання зупиниться з поясненням.
 */
export function orderPracticeLikeTheory(root: PageTree.Root): PageTree.Root {
  const practice = sectionFolder(root, "practice")
  if (!practice) return root

  const theoryOrder = new Map<string, number>()
  sectionFolder(root, "theory")?.children.forEach((node, index) => {
    const topic = topicOfNode(node)
    if (topic) theoryOrder.set(topic.slug, index)
  })

  const position = (node: PageTree.Node) => {
    const topic = topicOfNode(node)
    if (!topic) return Number.MAX_SAFE_INTEGER
    const index = theoryOrder.get(topic.slug)
    if (index === undefined) {
      throw new Error(
        `Практика «${topic.slug}» не має теорії в меню: створи content/theory/${topic.slug}.mdx ` +
          `(і перевір content/theory/meta.json)`
      )
    }
    return index
  }

  const children = [...practice.children].sort((a, b) => position(a) - position(b))
  return {
    ...root,
    children: root.children.map((node) => (node === practice ? { ...practice, children } : node)),
  }
}

export function topicsPlugin(): LoaderPlugin {
  return {
    name: "topics",
    transformPageTree: { root: orderPracticeLikeTheory },
  }
}
