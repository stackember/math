import { readdirSync, readFileSync } from "node:fs"
import { sep } from "node:path"

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
