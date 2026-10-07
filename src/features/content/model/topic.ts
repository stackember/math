/**
 * Угоди про файли й адреси — єдине місце, де записано, що предмет це коренева папка,
 * а тема — папка content/<предмет>/<розділ>/<тема>/:
 *   <предмет>/index.mdx            — огляд предмета    → /<предмет>
 *   …/<тема>/index.mdx             — теорія теми       → /<предмет>/<розділ>/<тема>
 *   …/<тема>/practice.mdx          — практика          → /<предмет>/<розділ>/<тема>/practice
 *   …/<тема>/<сторінка>.mdx        — підсторінка теорії
 * Схема frontmatter, меню, перевірка контенту, e2e і юніт-прогін беруть правила звідси —
 * шляхи файлів усюди відносно content/ (`CONTENT_DIR`), з «/» як роздільником.
 */
export const CONTENT_DIR = "content"
const PRACTICE = "practice"
const INDEX_FILE = "index.mdx"
const PRACTICE_FILE = `${PRACTICE}.mdx`
/** Сегментів до файлу теми: <предмет>/<розділ>/<тема>. */
const TOPIC_DEPTH = 3
const MDX = /\.mdx?$/

export interface Topic {
  subject: string
  area: string
  slug: string
}

type TopicPageKind = "theory" | "practice" | "subpage"

export interface TopicPage {
  topic: Topic
  kind: TopicPageKind
}

const segments = (path: string) => path.replace(/\\/g, "/").split("/").filter(Boolean)

/** Ключ теми для прогресу й змішаного тесту: `<предмет>/<slug>` (slug унікальний у предметі). */
export const topicId = ({ subject, slug }: Topic) => `${subject}/${slug}`

/** Файл теми за шляхом відносно content/; головна, сторінки предмета чи розділу, глибші файли — `null`. */
export function topicPage(relativePath: string): TopicPage | null {
  const parts = segments(relativePath)
  if (parts.length !== TOPIC_DEPTH + 1) return null
  const [subject, area, slug, file] = parts
  const kind =
    file === INDEX_FILE
      ? "theory"
      : file === PRACTICE_FILE
        ? "practice"
        : MDX.test(file)
          ? "subpage"
          : null
  return kind ? { topic: { subject, area, slug }, kind } : null
}

/** Огляд предмета: content/<предмет>/index.mdx → slug предмета. */
export function subjectIndex(relativePath: string): string | null {
  const parts = segments(relativePath)
  return parts.length === 2 && parts[1] === INDEX_FILE ? parts[0] : null
}

/** Сторінка не на своєму місці: у предметі (крім index.mdx) або просто в розділі — тема це папка. */
export const isStrayPage = (relativePath: string) => {
  const parts = segments(relativePath)
  const file = parts.at(-1) ?? ""
  if (!MDX.test(file)) return false
  return (parts.length === 2 && file !== INDEX_FILE) || parts.length === TOPIC_DEPTH
}

/** Адреса сторінки за шляхом файлу відносно content/: math/numbers/modulus/index.mdx → /math/numbers/modulus. */
export const urlOf = (relativePath: string) =>
  `/${segments(relativePath).join("/").replace(MDX, "").replace(/(^|\/)index$/, "")}`

export const theoryFile = ({ subject, area, slug }: Topic) => `${subject}/${area}/${slug}/${INDEX_FILE}`
export const practiceFile = ({ subject, area, slug }: Topic) =>
  `${subject}/${area}/${slug}/${PRACTICE_FILE}`

/** Тема сторінки за її slugs (Fumadocs), або `null` для сторінок поза темами (головна, предмет, розділ). */
export function topicOf(slugs: readonly string[]): Topic | null {
  if (slugs.length < TOPIC_DEPTH || slugs.length > TOPIC_DEPTH + 1) return null
  const [subject, area, slug] = slugs
  return subject && area && slug ? { subject, area, slug } : null
}

export const isPractice = (slugs: readonly string[]) =>
  slugs.length === TOPIC_DEPTH + 1 && slugs[TOPIC_DEPTH] === PRACTICE

export const slugsOfUrl = (url: string) => segments(url)
export const isPracticeUrl = (url: string) => isPractice(slugsOfUrl(url))

export const theorySlugs = ({ subject, area, slug }: Topic) => [subject, area, slug]
export const practiceSlugs = ({ subject, area, slug }: Topic) => [subject, area, slug, PRACTICE]
