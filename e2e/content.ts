import { readdirSync, readFileSync } from "node:fs"
import { sep } from "node:path"

import { parse } from "yaml"

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

export type PracticeQuestion =
  | { type: "choice"; answer: number }
  | { type: "match"; answer: number[] }
  | { type: "short"; answer: number }

/** Завдання практики з її frontmatter (у порядку файлу — це `data-question` картки). */
export function practiceQuestions(url: string): PracticeQuestion[] {
  const text = readFileSync(new URL(`${url.slice(1)}.mdx`, CONTENT_DIR), "utf8")
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1]
  if (!frontmatter) throw new Error(`${url}: немає frontmatter`)
  return (parse(frontmatter) as { trainer: { questions: PracticeQuestion[] } }).trainer.questions
}
