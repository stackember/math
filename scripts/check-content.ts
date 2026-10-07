/**
 * Швидка перевірка контенту без Next (секунди замість збирання):
 *   npm run check:content            — усі файли в content/
 *   npx tsx scripts/check-content.ts content/numbers/modulus/index.mdx — лише ці файли
 * Вивід: `файл:рядок:колонка: повідомлення` українською; код виходу 1, якщо є помилки.
 * Ті самі схеми й плагіни, що й під час збирання, плюс правила, які збирання не перевіряє.
 */
import { readdir, readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"

import type { Heading, Root as Mdast, Text } from "mdast"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkMdx from "remark-mdx"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"
import { VFile } from "vfile"
import { isMap, LineCounter, parseDocument } from "yaml"

import { frontmatterSchema } from "@/features/content/model/frontmatter"
import { PRACTICE } from "@/features/content/model/topic"
import { katexOptions } from "@/shared/lib/math"

export interface Problem {
  file: string
  line?: number
  column?: number
  message: string
}

const CONTENT = "content"

/** Розділи теорії в порядку формату; «Простими словами» — за потреби. */
const THEORY_SECTIONS = ["Коротко", "Простими словами", "Приклади", "Пастки"] as const
const OPTIONAL_SECTIONS: readonly string[] = ["Простими словами"]

/** Слова, яких у проєкті немає (див. AGENTS.md → «Мова і стиль»). */
const VOCABULARY: [RegExp, string][] = [
  [/(?<![\p{L}])уро[кц]/iu, "«урок» — у проєкті це «тема»"],
  [/(?<![\p{L}])питанн/iu, "«питання» — у проєкті це «завдання»"],
]

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm).use(remarkMath)
const renderer = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex, katexOptions)

interface Node {
  type: string
  children?: Node[]
  position?: { start: { line: number; column: number } }
}

function walk(node: Node, visitor: (node: Node, parents: Node[]) => void, parents: Node[] = []) {
  visitor(node, parents)
  for (const child of node.children ?? []) walk(child, visitor, [...parents, node])
}

const textOf = (node: Node): string =>
  node.type === "text" || node.type === "inlineCode"
    ? ((node as unknown as Text).value ?? "")
    : (node.children ?? []).map(textOf).join("")

/** Frontmatter YAML і тіло; `bodyLine` — рядок файлу, з якого починається тіло. */
function split(source: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  if (!match) return null
  return {
    yaml: match[1],
    body: source.slice(match[0].length),
    bodyLine: match[0].split("\n").length,
  }
}

/** Перевірка одного MDX-файлу: frontmatter за схемою, формули, структура й мова тексту. */
export async function checkMdx(file: string, source: string): Promise<Problem[]> {
  const problems: Problem[] = []
  const add = (message: string, line?: number, column?: number) =>
    problems.push({ file, line, column, message })

  const parts = split(source)
  if (!parts)
    return [{ file, line: 1, message: "немає frontmatter (блок --- … --- на початку файлу)" }]

  // 1. frontmatter — та сама схема, що й під час збирання, з рядком для кожної помилки
  const lineCounter = new LineCounter()
  const doc = parseDocument(parts.yaml, { lineCounter })
  for (const error of doc.errors) add(`YAML: ${error.message}`, error.linePos?.[0].line ?? 1)
  if (doc.errors.length === 0) {
    const result = await frontmatterSchema({ path: file, source })["~standard"].validate(doc.toJS())
    for (const issue of result.issues ?? []) {
      const path = (issue.path ?? []).map((p) => (typeof p === "object" ? p.key : p)) as (
        string | number
      )[]
      // рядок ключа поля (не його значення): для `trainer:` — сам рядок `trainer:`
      const parent = path.length > 1 ? doc.getIn(path.slice(0, -1), true) : doc.contents
      const last = path.at(-1)
      const pair = isMap(parent)
        ? parent.items.find((item) => String(item.key) === String(last))
        : null
      const node = pair?.key ?? (path.length ? doc.getIn(path, true) : null)
      const offset = (node as { range?: [number, number] } | null)?.range?.[0]
      const line = offset === undefined ? 2 : lineCounter.linePos(offset).line + 1
      add(`${path.length ? path.join(".") + ": " : ""}${issue.message}`, line)
    }
  }

  // 2. тіло: розбір MDX, формули (усі помилки одразу), структура, словник, мінус і кома
  const at = (node: Node) =>
    node.position ? [node.position.start.line + parts.bodyLine - 1, node.position.start.column] : []
  let tree: Mdast
  try {
    tree = parser.parse(parts.body)
    tree = (await parser.run(tree)) as Mdast
  } catch (error) {
    const e = error as { message: string; line?: number; column?: number }
    add(`MDX: ${e.message}`, (e.line ?? 1) + parts.bodyLine - 1, e.column)
    return problems
  }

  // rehype-katex не зупиняється на зламаній формулі, а збирає повідомлення — тут видно всі одразу
  const vfile = new VFile(parts.body)
  await renderer.run(renderer.parse(vfile), vfile)
  const messages = vfile.messages.filter((m) => m.source === "rehype-katex")
  for (const m of messages) {
    const detail = m.cause instanceof Error ? m.cause.message : m.reason
    add(`Помилка у формулі: ${detail}`, (m.line ?? 1) + parts.bodyLine - 1, m.column ?? undefined)
  }

  const isTheory = /(^|[\\/])index\.mdx$/.test(file) && file.split(/[\\/]/).length === 4
  if (isTheory) {
    const headings = tree.children.filter(
      (n): n is Heading => n.type === "heading" && n.depth === 2
    )
    const names = headings.map(textOf)
    let expected = 0
    for (const [i, name] of names.entries()) {
      const index = THEORY_SECTIONS.indexOf(name as (typeof THEORY_SECTIONS)[number])
      if (index === -1) {
        add(
          `розділ «${name}» поза форматом теорії: лише ${THEORY_SECTIONS.map((s) => `«${s}»`).join(", ")} (алгоритми й схеми — усередині «Простими словами» як ###)`,
          ...at(headings[i])
        )
        continue
      }
      if (index < expected)
        add(
          `розділ «${name}» не на своєму місці: порядок ${THEORY_SECTIONS.join(" → ")}`,
          ...at(headings[i])
        )
      expected = Math.max(expected, index + 1)
    }
    for (const section of THEORY_SECTIONS) {
      if (!OPTIONAL_SECTIONS.includes(section) && !names.includes(section)) {
        add(`немає розділу «## ${section}» — формат теорії: ${THEORY_SECTIONS.join(" → ")}`)
      }
    }
  }

  walk(tree as unknown as Node, (node, parents) => {
    if (node.type === "text") {
      const value = (node as unknown as Text).value
      for (const [pattern, message] of VOCABULARY)
        if (pattern.test(value)) add(`словник: ${message}`, ...at(node))
      if (/(^|[^\p{L}\p{N}])-\d/u.test(value))
        add("мінус перед числом поза формулою — пиши «−» (або формулу $-5$)", ...at(node))
      if (/\d\.\d/.test(value))
        add("десяткова крапка поза формулою — пиши кому: 0,25 (у формулі — 0{,}25)", ...at(node))
      if (value.includes("$") && parents.some((p) => p.type === "tableCell")) {
        add("формула в таблиці розірвана символом «|» — модуль пиши \\lvert x \\rvert", ...at(node))
      }
    }
  })

  return problems
}

/** Перевірки структури content/: пари теорія↔практика, унікальні slug тем, meta.json. */
export async function checkStructure(root = CONTENT): Promise<Problem[]> {
  const problems: Problem[] = []
  const entries = (await readdir(root, { recursive: true, withFileTypes: true })).map((e) => ({
    path: join(relative(root, e.parentPath), e.name).replace(/\\/g, "/"),
    dir: e.isDirectory(),
  }))
  const files = new Set(entries.filter((e) => !e.dir).map((e) => e.path))
  const dirs = new Set(entries.filter((e) => e.dir).map((e) => e.path))

  const topics = new Map<string, string[]>()
  for (const file of files) {
    const parts = file.split("/")
    if (parts.length === 3 && parts[2] === "index.mdx") {
      topics.set(parts[1], [...(topics.get(parts[1]) ?? []), `${root}/${file}`])
    }
    if (
      parts.length === 3 &&
      parts[2] === `${PRACTICE}.mdx` &&
      !files.has(`${parts[0]}/${parts[1]}/index.mdx`)
    ) {
      problems.push({
        file: `${root}/${file}`,
        message: "практика без теорії: поруч має бути index.mdx теми",
      })
    }
    if (parts.length === 2 && /\.mdx?$/.test(parts[1])) {
      problems.push({
        file: `${root}/${file}`,
        message: "сторінка просто в розділі: тема — це папка content/<розділ>/<тема>/index.mdx",
      })
    }
  }
  for (const [slug, where] of topics) {
    if (where.length > 1) {
      problems.push({
        file: where[1],
        message: `slug теми «${slug}» уже є в ${where[0]} — ключ прогресу trainer:<slug> має бути унікальним`,
      })
    }
  }

  for (const file of files) {
    if (!file.endsWith("meta.json")) continue
    const path = `${root}/${file}`
    const folder = dirname(file) === "." ? "" : dirname(file)
    let meta: { title?: unknown; icon?: unknown; pages?: unknown }
    try {
      meta = JSON.parse(await readFile(path, "utf8"))
    } catch (error) {
      problems.push({ file: path, message: `JSON: ${(error as Error).message}` })
      continue
    }
    if (folder && !folder.includes("/") && typeof meta.title !== "string") {
      problems.push({ file: path, message: "розділ без title (назва в меню)" })
    }
    if (typeof meta.icon === "string") {
      const icons = (await import("lucide-react")) as Record<string, unknown>
      if (!(meta.icon in icons))
        problems.push({
          file: path,
          message: `іконки «${meta.icon}» немає в lucide-react (назва у PascalCase, напр. Hash)`,
        })
    }
    for (const page of Array.isArray(meta.pages) ? (meta.pages as unknown[]) : []) {
      if (
        typeof page !== "string" ||
        page === "..." ||
        page.startsWith("---") ||
        page.startsWith("[")
      )
        continue
      const target = folder ? `${folder}/${page}` : page
      if (!dirs.has(target) && !files.has(`${target}.mdx`) && !files.has(`${target}.md`)) {
        problems.push({
          file: path,
          message: `pages: «${page}» не існує (немає ні папки, ні ${page}.mdx)`,
        })
      }
    }
  }
  return problems
}

export async function checkContent(only: string[] = []): Promise<Problem[]> {
  const all = (await readdir(CONTENT, { recursive: true }))
    .map((f) => `${CONTENT}/${String(f).replace(/\\/g, "/")}`)
    .filter((f) => /\.mdx?$/.test(f))
  const files = only.length
    ? only
        .map((f) => relative(process.cwd(), resolve(f)).replace(/\\/g, "/"))
        .filter((f) => /\.mdx?$/.test(f) && existsSync(f))
    : all
  const perFile = await Promise.all(
    files.map(async (file) => checkMdx(file, await readFile(file, "utf8")))
  )
  return [...perFile.flat(), ...(await checkStructure())]
}

export const formatProblem = (p: Problem) =>
  `${p.file}${p.line ? `:${p.line}${p.column ? `:${p.column}` : ""}` : ""}: ${p.message}`

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)
if (isMain) {
  const problems = await checkContent(process.argv.slice(2))
  for (const p of problems) console.error(formatProblem(p))
  if (problems.length) {
    console.error(`\n${problems.length} помилок у контенті`)
    process.exit(1)
  }
  console.log("Контент у порядку")
}
