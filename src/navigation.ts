import { existsSync } from "node:fs"
import type { StarlightUserConfig } from "@astrojs/starlight/types"

type SidebarItem = NonNullable<StarlightUserConfig["sidebar"]>[number]

export interface Topic {
  /** Назва файлу в `topics/<book>/` без розширення, напр. `01-numbers`. */
  slug: string
  /** Коротка назва для меню. */
  label: string
}

export interface Book {
  dir: "algebra" | "geometry"
  label: string
  topics: Topic[]
}

/**
 * Єдиний реєстр тем у порядку підручників.
 * Нова тема → новий рядок тут; уроки й тренажери до неї підхоплюються автоматично.
 */
export const books: Book[] = [
  {
    dir: "algebra",
    label: "Алгебра",
    topics: [{ slug: "01-numbers", label: "1. Числа, модуль, подільність" }],
  },
  {
    dir: "geometry",
    label: "Геометрія",
    topics: [],
  },
]

const docsDir = new URL("./content/docs/", import.meta.url)

const hasLessons = (book: Book, topic: Topic) =>
  existsSync(new URL(`lessons/${book.dir}/${topic.slug}/`, docsDir))

function topicGroup(book: Book, topic: Topic): SidebarItem {
  const items: SidebarItem[] = [
    {
      label: "📘 Конспект за підручником",
      slug: `topics/${book.dir}/${topic.slug}`,
    },
  ]
  if (hasLessons(book, topic)) {
    items.push({
      label: "🧠 Мої уроки",
      items: [{ autogenerate: { directory: `lessons/${book.dir}/${topic.slug}` } }],
    })
  }
  return { label: topic.label, collapsed: true, items }
}

export const sidebar: SidebarItem[] = [
  { label: "🏠 Як вчитися", link: "/" },
  ...books
    .filter((book) => book.topics.length > 0)
    .map((book) => ({
      label: book.label,
      items: book.topics.map((topic) => topicGroup(book, topic)),
    })),
  { label: "📎 Матеріали", slug: "materials" },
]
