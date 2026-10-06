import { readdirSync } from "node:fs"
import { sep } from "node:path"

const CONTENT_DIR = new URL("../content/", import.meta.url)

const MDX_FILES = readdirSync(CONTENT_DIR, { recursive: true })
  .map((file) => String(file).split(sep).join("/"))
  .filter((file) => file.endsWith(".mdx"))

/** Адреси всіх сторінок контенту: content/theory/modulus.mdx → /theory/modulus. */
export const CONTENT_URLS = MDX_FILES.map(
  (file) => `/${file.replace(/\.mdx$/, "").replace(/(^|\/)index$/, "")}`
)

/** Slug-и всіх практик: content/practice/number-sets.mdx → number-sets. */
export const PRACTICE_SLUGS = MDX_FILES.filter((file) => file.startsWith("practice/")).map((file) =>
  file.replace(/^practice\//, "").replace(/\.mdx$/, "")
)
