import { z } from "zod"

import type { ExamProfile, Range } from "./exam/profile"
import { lintQuestion } from "./lint"
import { questionSchema, type RenderedQuestion } from "./question/registry"

// Повідомлення Zod — українською; власний текст лише там, де стандартний незрозумілий
z.config(z.locales.uk())

const TAG_ID = /^[a-z][a-z0-9-]*$/

const label = z.string().trim().min(1, { error: "назва правила не може бути порожньою" })

const cache = new Map<string, ReturnType<typeof build>>()

/**
 * Блок `trainer` у frontmatter practice.mdx для профілю іспиту: правила теми (теги) і завдання.
 * Склад перевіряється під час збирання (`npm run build`, у `npm run dev` — при збереженні)
 * і зупиняє його з поясненням.
 */
export function trainerSchema(profile: ExamProfile) {
  let schema = cache.get(profile.id)
  if (!schema) cache.set(profile.id, (schema = build(profile)))
  return schema
}

function build(profile: ExamProfile) {
  return z
    .strictObject(
      {
        /** id правила → назва українською (видно в результатах). */
        tags: z.record(z.string(), label),
        questions: z.array(questionSchema(profile)),
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
      const seenQ = new Set<string>()
      const seenId = new Set<string>()

      trainer.questions.forEach((question, i) => {
        const n = `завдання ${i + 1}`
        const at = (field: string) => ["questions", i, field]

        if (!Object.hasOwn(trainer.tags, question.tag)) {
          issue(`${n}: тег «${question.tag}» не описаний у tags`, at("tag"))
        }
        usedTags.add(question.tag)

        if (seenQ.has(question.q)) issue(`${n}: така сама умова вже є`, at("q"))
        seenQ.add(question.q)

        if (question.id) {
          if (seenId.has(question.id)) issue(`${n}: id «${question.id}» уже є`, at("id"))
          seenId.add(question.id)
        }

        for (const problem of lintQuestion(question)) issue(`${n}: ${problem}`, at("options"))
      })

      for (const tag of Object.keys(trainer.tags)) {
        if (!usedTags.has(tag)) issue(`тег «${tag}» не покритий жодним завданням`, ["tags", tag])
      }

      const inRange = (what: string, value: number, [min, max]: Range) => {
        if (value < min || value > max)
          issue(`${what}: потрібно ${min}–${max}, зараз ${value}`, ["questions"])
      }
      const count = (predicate: (q: (typeof trainer.questions)[number]) => boolean) =>
        trainer.questions.filter(predicate).length
      const { composition } = profile

      inRange("усього завдань", trainer.questions.length, composition.total)
      for (const level of [1, 2, 3] as const) {
        inRange(
          `рівень ${"★".repeat(level)}`,
          count((q) => q.level === level),
          composition.levels[level]
        )
      }
      for (const [type, range] of Object.entries(composition.types)) {
        if (range)
          inRange(
            `тип ${type}`,
            count((q) => q.type === type),
            range
          )
      }
    })
}

export type TrainerData = z.infer<ReturnType<typeof trainerSchema>>

/** Тренажер після рендеру: `exam` — профіль, за яким перевірено й за яким показувати. */
export interface RenderedTrainer {
  exam: string
  tags: TrainerData["tags"]
  questions: RenderedQuestion[]
}
