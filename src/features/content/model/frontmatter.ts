import { readFile } from "node:fs/promises"
import { dirname, extname, resolve } from "node:path"

import { pageSchema } from "fumadocs-core/source/schema"
import { z } from "zod"

import { renderTrainer } from "@/features/trainer/model/render"
import { trainerSchema } from "@/features/trainer/model/schema"
import { createMarkdown } from "@/shared/lib/markdown"

/** Файл практики: content/<розділ>/<тема>/practice.mdx. */
const isPracticeFile = (path: string) => /(^|[\\/])practice\.mdx$/.test(path)

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
 * Практика: тренажер обов'язковий. Після перевірки складу формули, Markdown і рисунки завдань
 * рендеряться в HTML тут же, під час збирання — у браузер іде готовий HTML, KaTeX там не потрібен.
 */
const practiceSchema = (file: string) =>
  pageSchema.extend({
    trainer: trainerSchema.transform((trainer) =>
      renderTrainer(trainer, { md, readAsset: assetReader(file) })
    ),
  })

/**
 * Схема frontmatter залежить від імені файлу: fumadocs-mdx викликає цю функцію
 * для кожного документа зі шляхом до нього. Помилки — під час збирання, українською.
 */
export const frontmatterSchema = ({ path }: { path: string }) =>
  isPracticeFile(path) ? practiceSchema(path) : theorySchema
