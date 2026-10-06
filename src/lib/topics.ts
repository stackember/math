/**
 * Угоди про сторінки (id у колекції `docs`):
 *   theory/<slug>    — теорія теми
 *   practice/<slug>  — практика (тренажер) до теми з тим самим <slug>
 * Порядок тем — `sidebar.order` у frontmatter (крок 10); у практики той самий order, що в теорії.
 */
export type Section = "theory" | "practice"

export type PageInfo = { section: Section; slug: string } | { section: null }

export function describe(id: string): PageInfo {
  const [section, slug, ...rest] = id.split("/")
  if ((section === "theory" || section === "practice") && slug && rest.length === 0) {
    return { section, slug }
  }
  return { section: null }
}

export const pageId = (section: Section, slug: string) => `${section}/${slug}`

/** Для теорії — її практика, для практики — її теорія. */
export const pairOf = (section: Section, slug: string) =>
  pageId(section === "theory" ? "practice" : "theory", slug)

export const href = (id: string) => `/${id}/`
