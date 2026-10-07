import { z } from "zod"

import { EXAM } from "./exam"
import { lintQuestion } from "./lint"
import { questionSchema, type RenderedQuestion } from "./question/registry"

// Повідомлення Zod — українською; власний текст лише там, де стандартний незрозумілий
z.config(z.locales.uk())

/**
 * Правила складу тренажера — з профілю іспиту (exam.ts). Перевіряються під час збирання сайту
 * (`npm run build`, а в `npm run dev` — одразу при збереженні) — порушення зупиняє збирання з поясненням.
 */
const RULES = {
  total: EXAM.composition.total,
  levels: EXAM.composition.levels,
  types: EXAM.composition.types,
} as const

const TAG_ID = /^[a-z][a-z0-9-]*$/

const label = z.string().trim().min(1, { error: "назва правила не може бути порожньою" })

/** Блок `trainer` у frontmatter practice.mdx: правила теми (теги) і завдання. */
export const trainerSchema = z
  .strictObject(
    {
      /** id правила → назва українською (видно в результатах). */
      tags: z.record(z.string(), label),
      questions: z.array(questionSchema),
    },
    { error: "немає блоку trainer: у practice.mdx тренажер обов'язковий" }
  )
  .superRefine((trainer, ctx) => {
    const issue = (message: string, path: (string | number)[] = []) =>
      ctx.addIssue({ code: "custom", message, path })

    for (const id of Object.keys(trainer.tags)) {
      if (!TAG_ID.test(id)) issue(`тег «${id}»: id латиницею в kebab-case`, ["tags", id])
    }

    const usedTags = new Set<string>()
    const seen = new Set<string>()

    trainer.questions.forEach((question, i) => {
      const n = `завдання ${i + 1}`
      const at = (field: string) => ["questions", i, field]

      if (!Object.hasOwn(trainer.tags, question.tag)) {
        issue(`${n}: тег «${question.tag}» не описаний у tags`, at("tag"))
      }
      usedTags.add(question.tag)

      if (seen.has(question.q)) issue(`${n}: така сама умова вже є`, at("q"))
      seen.add(question.q)

      for (const problem of lintQuestion(question)) issue(`${n}: ${problem}`, at("options"))
    })

    for (const tag of Object.keys(trainer.tags)) {
      if (!usedTags.has(tag)) issue(`тег «${tag}» не покритий жодним завданням`, ["tags", tag])
    }

    const inRange = (what: string, value: number, [min, max]: readonly [number, number]) => {
      if (value < min || value > max)
        issue(`${what}: потрібно ${min}–${max}, зараз ${value}`, ["questions"])
    }
    const count = (predicate: (q: (typeof trainer.questions)[number]) => boolean) =>
      trainer.questions.filter(predicate).length

    inRange("усього завдань", trainer.questions.length, RULES.total)
    for (const level of [1, 2, 3] as const) {
      inRange(
        `рівень ${"★".repeat(level)}`,
        count((q) => q.level === level),
        RULES.levels[level]
      )
    }
    inRange(
      "тип match",
      count((q) => q.type === "match"),
      RULES.types.match
    )
    inRange(
      "тип short",
      count((q) => q.type === "short"),
      RULES.types.short
    )
  })

export type TrainerData = z.infer<typeof trainerSchema>
export type RenderedTrainer = { tags: TrainerData["tags"]; questions: RenderedQuestion[] }
