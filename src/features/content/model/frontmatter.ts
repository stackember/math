import { pageSchema } from "fumadocs-core/source/schema"
import { z } from "zod"

import { renderTrainer } from "@/features/trainer/model/render"
import { trainerSchema } from "@/features/trainer/model/schema"

/** Файл практики: content/<розділ>/<тема>/practice.mdx. */
const isPracticeFile = (path: string) => /(^|[\\/])practice\.mdx$/.test(path)

/** Теорія і будь-яка інша сторінка: тренажера тут бути не може. */
const theorySchema = pageSchema.extend({
  trainer: z.never({ error: "блок trainer можна описувати лише у файлі practice.mdx" }).optional(),
})

/**
 * Практика: тренажер обов'язковий. Після перевірки складу формули й Markdown завдань
 * рендеряться в HTML тут же, під час збирання — у браузер іде готовий HTML, KaTeX там не потрібен.
 */
const practiceSchema = pageSchema.extend({
  trainer: trainerSchema.transform(renderTrainer),
})

/**
 * Схема frontmatter залежить від імені файлу: fumadocs-mdx викликає цю функцію
 * для кожного документа зі шляхом до нього. Помилки — під час збирання, українською.
 */
export const frontmatterSchema = ({ path }: { path: string }) =>
  isPracticeFile(path) ? practiceSchema : theorySchema
