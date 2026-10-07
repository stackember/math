/**
 * Угоди про файли й адреси тем — єдине місце, де записано, що тема це папка content/<розділ>/<тема>/:
 *   index.mdx       — теорія теми        → /<розділ>/<тема>
 *   practice.mdx    — практика (тренажер) → /<розділ>/<тема>/practice
 *   <сторінка>.mdx  — підсторінка теорії  → /<розділ>/<тема>/<сторінка>
 * Пара теорія↔практика — сусідні файли однієї папки; порядок тем задає meta.json розділу.
 * Схема frontmatter, меню, перевірка контенту, e2e і юніт-прогін практик беруть правила звідси —
 * шляхи файлів усюди відносно content/ (`CONTENT_DIR`), з «/» як роздільником.
 */
export const CONTENT_DIR = "content"
const PRACTICE = "practice"
const THEORY_FILE = "index.mdx"
const PRACTICE_FILE = `${PRACTICE}.mdx`
/** Скільки сегментів до файлу теми: <розділ>/<тема>. */
const TOPIC_DEPTH = 2
const MDX = /\.mdx?$/

export interface Topic {
  area: string
  slug: string
}

type TopicPageKind = "theory" | "practice" | "subpage"

export interface TopicPage {
  topic: Topic
  kind: TopicPageKind
}

const segments = (path: string) => path.replace(/\\/g, "/").split("/").filter(Boolean)

/** Файл теми за шляхом відносно content/; головна, сторінка розділу чи глибші файли — `null`. */
export function topicPage(relativePath: string): TopicPage | null {
  const parts = segments(relativePath)
  if (parts.length !== TOPIC_DEPTH + 1) return null
  const [area, slug, file] = parts
  const kind =
    file === THEORY_FILE
      ? "theory"
      : file === PRACTICE_FILE
        ? "practice"
        : MDX.test(file)
          ? "subpage"
          : null
  return kind ? { topic: { area, slug }, kind } : null
}

/** Сторінка просто в розділі (content/<розділ>/<x>.mdx) — поза угодою: тема це папка. */
export const isStrayPage = (relativePath: string) => {
  const parts = segments(relativePath)
  return parts.length === TOPIC_DEPTH && MDX.test(parts.at(-1) ?? "")
}

/** Адреса сторінки за шляхом файлу відносно content/: numbers/modulus/index.mdx → /numbers/modulus. */
export const urlOf = (relativePath: string) =>
  `/${segments(relativePath).join("/").replace(MDX, "").replace(/(^|\/)index$/, "")}`

export const theoryFile = ({ area, slug }: Topic) => `${area}/${slug}/${THEORY_FILE}`
export const practiceFile = ({ area, slug }: Topic) => `${area}/${slug}/${PRACTICE_FILE}`

/** Тема сторінки за її slugs (Fumadocs), або `null` для сторінок поза темами (головна, розділ). */
export function topicOf(slugs: readonly string[]): Topic | null {
  if (slugs.length < TOPIC_DEPTH || slugs.length > TOPIC_DEPTH + 1) return null
  const [area, slug] = slugs
  return area && slug ? { area, slug } : null
}

export const isPractice = (slugs: readonly string[]) =>
  slugs.length === TOPIC_DEPTH + 1 && slugs[TOPIC_DEPTH] === PRACTICE

export const slugsOfUrl = (url: string) => segments(url)
export const isPracticeUrl = (url: string) => isPractice(slugsOfUrl(url))

export const theorySlugs = ({ area, slug }: Topic) => [area, slug]
export const practiceSlugs = ({ area, slug }: Topic) => [area, slug, PRACTICE]
