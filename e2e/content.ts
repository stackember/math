import { readdirSync, readFileSync } from "node:fs"
import { sep } from "node:path"

import { parse } from "yaml"

import {
  CONTENT_DIR as CONTENT,
  isPracticeUrl,
  practiceFile,
  slugsOfUrl,
  theoryFile,
  topicOf,
  urlOf,
} from "@/features/content/model/topic"
import type { Question } from "@/features/trainer/model/question/registry"

const CONTENT_DIR = new URL(`../${CONTENT}/`, import.meta.url)

const FILES = readdirSync(CONTENT_DIR, { recursive: true })
  .map((file) => String(file).split(sep).join("/"))
  .filter((file) => /\.mdx?$/.test(file))

/** Адреси всіх сторінок контенту (угода — topic.ts): numbers/modulus/index.mdx → /numbers/modulus. */
export const CONTENT_URLS = FILES.map(urlOf)

/** Адреси всіх практик: numbers/number-sets/practice.mdx → /numbers/number-sets/practice. */
export const PRACTICE_URLS = CONTENT_URLS.filter(isPracticeUrl)

/** Сторінки поза контентом (маршрути в src/app/): змішаний тест і прогрес. */
export const EXTRA_URLS = ["/test", "/progress"]

/** Сторінки, де тренажер вантажиться лише в браузері — чекати картку перед вимірами. */
export const TRAINER_URLS = [...PRACTICE_URLS, "/test"]

/** Практика за slug теми — для змішаного тесту, де картка несе `data-topic`. */
export const PRACTICE_URL_BY_SLUG = Object.fromEntries(
  PRACTICE_URLS.map((url) => [topicOf(slugsOfUrl(url))?.slug ?? "", url])
)

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
  return frontmatterOf(theoryFile({ area, slug })).title as string
}

const topicOfUrl = (url: string) => {
  const topic = topicOf(slugsOfUrl(url))
  if (!topic) throw new Error(`${url}: не адреса теми`)
  return topic
}

/**
 * Завдання практики з її frontmatter (у порядку файлу — це `data-question` картки).
 * Сирий YAML без значень за замовчуванням, але тип і відповідь — як у схемі.
 */
export function practiceQuestions(url: string): Question[] {
  return (frontmatterOf(practiceFile(topicOfUrl(url))).trainer as { questions: Question[] })
    .questions
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
