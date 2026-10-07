import { z } from "zod"

import { EXAM } from "./exam"

/**
 * Правила складу тренажера — з профілю іспиту (exam.ts). Перевіряються під час збирання сайту
 * (`npm run build`, а в `npm run dev` — одразу при збереженні) — порушення зупиняє збирання з поясненням.
 */
export const RULES = {
  total: EXAM.composition.total,
  levels: EXAM.composition.levels,
  types: EXAM.composition.types,
  choiceOptions: EXAM.choiceOptions,
  matchLeft: EXAM.matchLeft,
  matchRight: EXAM.matchRight,
} as const

/** Варіанти, що залежать від порядку, ламаються після перемішування. */
const POSITIONAL = /(усі|всі) (перелічені|наведені)|жод\S* з (перелічених|наведених)/i

const text = z.string().trim().min(1)

const common = {
  /** 1 — легке, 2 — рівень НМТ, 3 — пастка. */
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  /** Ключ з `tags`: яке правило теми перевіряє завдання. */
  tag: z.string(),
  /** Умова. Markdown + формули `$...$`. */
  q: text,
  /** Розв'язок і чому інші варіанти хибні. Показується після перевірки. */
  why: text,
}

const choiceQuestion = z.object({
  type: z.literal("choice"),
  ...common,
  options: z.array(text).length(RULES.choiceOptions),
  /** Індекс правильного варіанта в `options`, з 0. */
  answer: z
    .number()
    .int()
    .min(0)
    .max(RULES.choiceOptions - 1),
  /** Не перемішувати варіанти (напр. числа за зростанням). */
  keepOrder: z.boolean().default(false),
})

const matchQuestion = z.object({
  type: z.literal("match"),
  ...common,
  left: z.array(text).length(RULES.matchLeft),
  right: z.array(text).length(RULES.matchRight),
  /** `answer[i]` — індекс у `right` для рядка `left[i]`. */
  answer: z
    .array(
      z
        .number()
        .int()
        .min(0)
        .max(RULES.matchRight - 1)
    )
    .length(RULES.matchLeft),
})

const shortQuestion = z.object({
  type: z.literal("short"),
  ...common,
  /** Ціле або скінченний десятковий дріб. */
  answer: z.number(),
})

export const questionSchema = z.discriminatedUnion("type", [
  choiceQuestion,
  matchQuestion,
  shortQuestion,
])

/** Блок `trainer` у frontmatter practice.mdx: правила теми (теги) і завдання. */
export const trainerSchema = z
  .object(
    {
      /** id правила → назва українською (видно в результатах). */
      tags: z.record(z.string().regex(/^[a-z][a-z0-9-]*$/, "id тегу: латиниця в kebab-case"), text),
      questions: z.array(questionSchema),
    },
    { error: "немає блоку trainer: у practice.mdx тренажер обов'язковий" }
  )
  .superRefine((trainer, ctx) => {
    const issue = (message: string, path: (string | number)[] = []) =>
      ctx.addIssue({ code: "custom", message, path: ["questions", ...path] })

    const usedTags = new Set<string>()
    const seen = new Set<string>()

    trainer.questions.forEach((question, i) => {
      const n = `завдання ${i + 1}`
      if (!(question.tag in trainer.tags))
        issue(`${n}: тег «${question.tag}» не описаний у tags`, [i, "tag"])
      usedTags.add(question.tag)

      if (seen.has(question.q)) issue(`${n}: така сама умова вже є`, [i, "q"])
      seen.add(question.q)

      if (question.type === "choice") {
        if (new Set(question.options).size !== question.options.length) {
          issue(`${n}: варіанти повторюються`, [i, "options"])
        }
        if (!question.keepOrder) {
          const positional = question.options.find((option) => POSITIONAL.test(option))
          if (positional) {
            issue(`${n}: «${positional}» залежить від порядку, а варіанти перемішуються`, [
              i,
              "options",
            ])
          }
        }
      }
      if (question.type === "match" && new Set(question.answer).size !== question.answer.length) {
        issue(`${n}: відповіді у відповідності мають бути різними`, [i, "answer"])
      }
    })

    for (const tag of Object.keys(trainer.tags)) {
      if (!usedTags.has(tag)) issue(`тег «${tag}» не покритий жодним завданням`)
    }

    const inRange = (label: string, value: number, [min, max]: readonly [number, number]) => {
      if (value < min || value > max) issue(`${label}: потрібно ${min}–${max}, зараз ${value}`)
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
export type Question = z.infer<typeof questionSchema>
