import { readdirSync, readFileSync } from "node:fs"
import { sep } from "node:path"

import { parse } from "yaml"

import type { Question } from "@/features/trainer/model/question/registry"

const CONTENT_DIR = new URL("../content/", import.meta.url)

const FILES = readdirSync(CONTENT_DIR, { recursive: true })
  .map((file) => String(file).split(sep).join("/"))
  .filter((file) => /\.mdx?$/.test(file))

/** Адреси всіх сторінок контенту: content/numbers/modulus/index.mdx → /numbers/modulus. */
export const CONTENT_URLS = FILES.map(
  (file) => `/${file.replace(/\.mdx?$/, "").replace(/(^|\/)index$/, "")}`
)

/** Адреси всіх практик: content/numbers/number-sets/practice.mdx → /numbers/number-sets/practice. */
export const PRACTICE_URLS = CONTENT_URLS.filter((url) => url.endsWith("/practice"))

/** Порядок тем розділу «Числа» з його meta.json — для перевірки меню. */
export const NUMBERS_ORDER = (
  JSON.parse(readFileSync(new URL("numbers/meta.json", CONTENT_DIR), "utf8")) as {
    pages: string[]
  }
).pages.filter((slug) => slug !== "...")

const frontmatterOf = (file: string) => {
  const text = readFileSync(new URL(file, CONTENT_DIR), "utf8")
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1]
  if (!frontmatter) throw new Error(`${file}: немає frontmatter`)
  return parse(frontmatter) as Record<string, unknown>
}

/** Назва теми з frontmatter її теорії — так вона підписана в меню. */
export function topicTitle(area: string, slug: string): string {
  return frontmatterOf(`${area}/${slug}/index.mdx`).title as string
}

/**
 * Завдання практики з її frontmatter (у порядку файлу — це `data-question` картки).
 * Сирий YAML без значень за замовчуванням, але тип і відповідь — як у схемі.
 */
export function practiceQuestions(url: string): Question[] {
  return (frontmatterOf(`${url.slice(1)}.mdx`).trainer as { questions: Question[] }).questions
}

/**
 * Еталонні практики — найменший набір, що разом покриває всі типи завдань.
 * Локально повне проходження йде лише для них, у CI — для всіх (`PRACTICE_URLS`),
 * щоб `npm run verify` не ріс із кількістю тем; кожну практику й так проганяє Vitest.
 */
export const REFERENCE_PRACTICE_URLS = PRACTICE_URLS.filter((url, i, urls) => {
  const covered = new Set(urls.slice(0, i).flatMap((u) => practiceQuestions(u).map((q) => q.type)))
  return practiceQuestions(url).some((q) => !covered.has(q.type))
})
