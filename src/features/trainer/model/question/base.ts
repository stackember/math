import { z } from "zod"

import type { Markdown } from "@/shared/lib/markdown"

/** Непорожній текст з Markdown і формулами. */
export const text = z
  .string({ error: "має бути текст" })
  .trim()
  .min(1, { error: "текст не може бути порожнім" })

/** Поля, спільні для всіх типів завдань. */
export const common = {
  /** 1 — легке, 2 — рівень НМТ, 3 — пастка. */
  level: z.union([z.literal(1), z.literal(2), z.literal(3)], {
    error: "level: 1 (легке), 2 (рівень НМТ) або 3 (пастка)",
  }),
  /** Ключ з `tags`: яке правило теми перевіряє завдання. */
  tag: z.string({ error: "tag: id правила з tags" }),
  /** Умова: Markdown з формулами; може бути кілька абзаців, `$$…$$`, таблиця. */
  q: text,
  /** Розв'язок і чому інші варіанти хибні. Показується після перевірки. */
  why: text,
  /** Рисунок до умови: файл у папці теми, `alt` — опис для читачів екрана. */
  figure: z
    .strictObject({
      src: z.string().regex(/^\.\//, {
        error: "figure.src — відносний шлях у папці теми, напр. ./figures/x.svg",
      }),
      alt: text,
    })
    .optional(),
}

/** Що движок додає до завдання після рендеру під час збирання. */
export interface CommonRendered {
  /** Стабільний id — індекс у frontmatter. */
  id: number
  /** Рисунок як HTML (`<img>` з вбудованими даними). */
  figureHtml?: string
}

/**
 * Контракт модуля типу завдання — усе, що движок має знати про тип.
 * Новий тип = новий файл поруч + рядок у registry.ts; TypeScript не дасть пропустити метод.
 * `Q` — завдання (до рендеру — Markdown, після — HTML, форма та сама), `D` — чернетка відповіді.
 */
export interface QuestionModule<Q, D> {
  /** Рендер власних текстових полів типу (варіантів тощо); умову й пояснення рендерить движок. */
  render(question: Q, md: Markdown): Promise<Q>
  /** Порядок показу варіантів (індекси); порожній, якщо тип не перемішує. */
  displayOrder(question: Q, random: () => number): number[]
  emptyDraft(question: Q): D
  isAnswered(draft: D): boolean
  /** Чому відповідь не можна перевірити (напр. не число), інакше `null`. */
  invalidReason(draft: D): string | null
  isCorrect(question: Q, draft: D): boolean
  /** Правильна відповідь, як на бланку (HTML); літери — відносно порядку показу. */
  answerHtml(question: Q, order: number[]): string
}
