import { pageSchema } from "fumadocs-core/source/schema"
import { z } from "zod"

import { trainerSchema } from "@/trainer/schema"

/** Файл практики: content/<розділ>/<тема>/practice.mdx. */
export const isPracticeFile = (path: string) => /(^|[\\/])practice\.mdx$/.test(path)

/** Теорія і будь-яка інша сторінка: тренажера тут бути не може. */
export const theorySchema = pageSchema.extend({
  trainer: z.never({ error: "блок trainer можна описувати лише у файлі practice.mdx" }).optional(),
})

/** Практика: тренажер обов'язковий, склад перевіряється схемою тренажера. */
export const practiceSchema = pageSchema.extend({
  trainer: trainerSchema,
})

/**
 * Схема frontmatter залежить від імені файлу: fumadocs-mdx викликає цю функцію
 * для кожного документа зі шляхом до нього. Помилки — під час збирання, українською.
 */
export const frontmatterSchema = ({ path }: { path: string }) =>
  isPracticeFile(path) ? practiceSchema : theorySchema
