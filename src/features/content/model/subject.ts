import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { z } from "zod"

import {
  examProfileIdSchema,
  profileOf,
  type ExamProfileId,
} from "@/features/trainer/model/exam/registry"
import type { ExamProfile } from "@/features/trainer/model/exam/profile"

import { CONTENT_DIR } from "./topic"

/**
 * Предмет — коренева папка content/<предмет>/ з meta.json, де `root: true` (вкладка в меню Fumadocs)
 * і `exam` — профіль іспиту з реєстру. Усе предметне в коді береться звідси; правила для AI —
 * у .claude/rules/subjects/<предмет>.md.
 */
export const subjectMetaSchema = z.object({
  title: z.string({ error: "title: назва предмета" }).min(1),
  description: z.string().optional(),
  /** Іконка lucide у меню (PascalCase). */
  icon: z.string().optional(),
  root: z.literal(true, { error: "root: true — предмет це кореневий розділ меню" }),
  exam: examProfileIdSchema,
  pages: z.array(z.string()).optional(),
  defaultOpen: z.boolean().optional(),
})

export interface Subject {
  slug: string
  title: string
  description?: string
  icon?: string
  exam: ExamProfileId
}

const META = "meta.json"

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"))

function readSubject(slug: string): Subject | null {
  const path = join(CONTENT_DIR, slug, META)
  if (!existsSync(path)) return null
  const raw = readJson(path) as { root?: unknown }
  if (raw.root !== true) return null
  const result = subjectMetaSchema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    throw new Error(`${path}: ${issues}`)
  }
  const { title, description, icon, exam } = result.data
  return { slug, title, description, icon, exam }
}

/** Усі предмети в порядку `content/meta.json` → `pages`; не перелічені — у кінці, як у Fumadocs. */
export function subjects(): Subject[] {
  const order = (readJson(join(CONTENT_DIR, META)) as { pages?: string[] }).pages ?? []
  const rank = (slug: string) => {
    const i = order.indexOf(slug)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }
  return readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readSubject(entry.name))
    .filter((subject): subject is Subject => subject !== null)
    .sort((a, b) => rank(a.slug) - rank(b.slug))
}

export const subjectOf = (slug: string): Subject | undefined =>
  subjects().find((subject) => subject.slug === slug)

/** Профіль іспиту предмета; невідомий предмет — помилка з підказкою, як його описати. */
export function profileOfSubject(slug: string): ExamProfile {
  const subject = subjectOf(slug)
  if (!subject) {
    throw new Error(
      `Невідомий предмет «${slug}»: потрібен ${CONTENT_DIR}/${slug}/${META} з { "root": true, "exam": "<профіль>" }`
    )
  }
  return profileOf(subject.exam)
}
