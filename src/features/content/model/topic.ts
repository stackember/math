/**
 * Угоди про сторінки (slugs у Fumadocs):
 *   <розділ>/<тема>             — теорія теми (content/<розділ>/<тема>/index.mdx)
 *   <розділ>/<тема>/<сторінка>  — підсторінка теорії
 *   <розділ>/<тема>/practice    — практика (тренажер) до теми
 * Пара теорія↔практика — сусідні файли однієї папки; порядок тем задає meta.json розділу.
 */
export const PRACTICE = "practice"

export interface Topic {
  area: string
  slug: string
}

/** Тема сторінки за її slugs, або `null` для сторінок поза темами (головна, розділ). */
export function topicOf(slugs: readonly string[]): Topic | null {
  if (slugs.length < 2 || slugs.length > 3) return null
  const [area, slug] = slugs
  return area && slug ? { area, slug } : null
}

export const isPractice = (slugs: readonly string[]) =>
  slugs.length === 3 && slugs[2] === PRACTICE

export const theorySlugs = ({ area, slug }: Topic) => [area, slug]
export const practiceSlugs = ({ area, slug }: Topic) => [area, slug, PRACTICE]
