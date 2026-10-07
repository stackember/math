import { readFile } from "node:fs/promises"
import { dirname, extname, relative, resolve } from "node:path"

import { pageSchema } from "fumadocs-core/source/schema"
import { z } from "zod"

import type { ExamProfile } from "@/features/trainer/model/exam/profile"
import { renderTrainer } from "@/features/trainer/model/render"
import { trainerSchema } from "@/features/trainer/model/schema"
import { createMarkdown } from "@/shared/lib/markdown"

import { profileOfSubject } from "./subject"
import { CONTENT_DIR, topicPage } from "./topic"

/** Шлях від fumadocs-mdx може бути абсолютним або від кореня — угода в topic.ts хоче відносно content/. */
const inContent = (path: string) => relative(resolve(CONTENT_DIR), resolve(path))

/** Тіло MDX після frontmatter (порожній рядок, якщо файл — лише frontmatter). */
const bodyOf = (source: string) => source.replace(/^---\r?\n[\s\S]*?\r?\n---/, "").trim()

const md = createMarkdown()

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
}

/** Рисунки завдань лежать поруч із practice.mdx і вбудовуються під час збирання. */
const assetReader = (file: string) => async (src: string) => {
  const mime = MIME[extname(src).toLowerCase()]
  if (!mime) throw new Error(`figure.src «${src}»: підтримуються svg, png, jpg, webp`)
  const data = await readFile(resolve(dirname(file), src)).catch(() => {
    throw new Error(`figure.src «${src}»: файл не знайдено поруч із ${file}`)
  })
  return { mime, base64: data.toString("base64") }
}

/** Теорія і будь-яка інша сторінка: тренажера тут бути не може. */
const theorySchema = pageSchema.extend({
  trainer: z.never({ error: "блок trainer можна описувати лише у файлі practice.mdx" }).optional(),
})

/**
 * Практика: тренажер обов'язковий за профілем іспиту предмета, а тексту під frontmatter немає —
 * практика це лише тренажер, правила належать сторінці теорії. Після перевірки складу формули,
 * Markdown і рисунки рендеряться в HTML тут же, під час збирання.
 */
const practiceSchema = (file: string, source: string, profile: ExamProfile) =>
  pageSchema
    .extend({
      trainer: trainerSchema(profile).transform((trainer) =>
        renderTrainer(trainer, { md, profile, readAsset: assetReader(file) })
      ),
    })
    .superRefine((_, ctx) => {
      if (bodyOf(source) !== "") {
        ctx.addIssue({
          code: "custom",
          message:
            "practice.mdx — лише frontmatter: практика це тільки тренажер, правила пиши на сторінці теорії",
        })
      }
    })

/**
 * Схема frontmatter залежить від файлу: fumadocs-mdx викликає цю функцію для кожного документа
 * зі шляхом і текстом. Помилки — під час збирання, українською.
 */
export const frontmatterSchema = ({ path, source }: { path: string; source: string }) => {
  const page = topicPage(inContent(path))
  return page?.kind === "practice"
    ? practiceSchema(path, source, profileOfSubject(page.topic.subject))
    : theorySchema
}
