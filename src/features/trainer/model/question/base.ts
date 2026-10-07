import { z } from "zod"

import type { Markdown } from "@/shared/lib/markdown"

import type { ExamProfile } from "../exam/profile"

/** Непорожній текст з Markdown і формулами. */
export const text = z
  .string({ error: "має бути текст" })
  .trim()
  .min(1, { error: "текст не може бути порожнім" })

/** Поля, спільні для всіх типів завдань. */
export const common = {
  /** Стабільний ідентифікатор (kebab-case, унікальний у практиці) — для прогресу й майбутньої бази даних. */
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*$/, { error: "id: латиницею в kebab-case, напр. zero-not-natural" })
    .optional(),
  /** 1 — легке, 2 — рівень іспиту, 3 — пастка. */
  level: z.union([z.literal(1), z.literal(2), z.literal(3)], {
    error: "level: 1 (легке), 2 (рівень іспиту) або 3 (пастка)",
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
  /** Порядковий номер у практиці (з 0) — ключ картки й e2e. */
  index: number
  /** Рисунок як HTML (`<img>` з вбудованими даними). */
  figureHtml?: string
  /** Id теми (`<предмет>/<slug>`) — лише у змішаному тесті, де завдання з різних практик. */
  topic?: string
}

/** Опис типу для документації: повідомлення схеми, `npm run rules`, skill /practice. */
interface QuestionMeta {
  /** Коротка назва українською: «вибір відповіді». */
  label: string
  /** Як відповідати — без чисел профілю, вони друкуються окремо. */
  answerHint: string
  /** Приклади завдань у YAML (список), валідні за профілем за замовчуванням. */
  example: string
}

/** Зауваження евристики якості: `error` зупиняє збирання, `warn` показує лише `npm run check`. */
export interface LintProblem {
  severity: "error" | "warn"
  text: string
}

/** Схема типу залежить від профілю іспиту (кількість варіантів, полів тощо). */
export type SchemaFactory = (profile: ExamProfile) => z.ZodType<{ type: string }>

export type QuestionOf<S extends SchemaFactory> = z.output<ReturnType<S>>

/**
 * Контракт модуля типу завдання — усе, що движок має знати про тип.
 * Новий тип = файл поруч + рядок у registry.ts; TypeScript не дасть пропустити метод.
 * `S` — фабрика схеми (вивід — завдання до рендеру з Markdown, після — HTML, форма та сама),
 * `D` — чернетка відповіді.
 */
export interface QuestionModule<S extends SchemaFactory, D> {
  type: QuestionOf<S>["type"]
  schema: S
  meta: QuestionMeta
  /** Рендер власних текстових полів типу (варіантів тощо); умову й пояснення рендерить движок. */
  render(question: QuestionOf<S>, md: Markdown): Promise<QuestionOf<S>>
  /** Порядок показу варіантів (індекси); порожній, якщо тип не перемішує. */
  displayOrder(question: QuestionOf<S>, random: () => number): number[]
  emptyDraft(question: QuestionOf<S>): D
  isAnswered(draft: D): boolean
  /** Чому відповідь не можна перевірити (напр. не число), інакше `null`. */
  invalidReason(draft: D): string | null
  isCorrect(question: QuestionOf<S>, draft: D): boolean
  /** Правильна відповідь, як на бланку (HTML); літери профілю — відносно порядку показу. */
  answerHtml(question: QuestionOf<S>, order: number[], profile: ExamProfile): string
  /** Еталонна правильна чернетка — для прогону практик і тестів. */
  correctDraft(question: QuestionOf<S>): D
  /** Гарантовано неправильна, але придатна до перевірки чернетка. */
  wrongDraft(question: QuestionOf<S>): D
  /** Клавіша-цифра 1–9: оновлення чернетки або `null`, якщо тип її не використовує. */
  digit?(question: QuestionOf<S>, order: number[], digit: number): ((draft: D) => D) | null
  /** Евристики якості, що залежать від типу (загальні — у ../lint.ts). */
  lint?(question: QuestionOf<S>): LintProblem[]
}

/** Варіанти, що залежать від порядку або посилаються на літери, ламаються після перемішування. */
const POSITIONAL =
  /(усі|всі|усе|все)\s+(перелічен|наведен)|жодн\S*\s+(з|із)\s+(перелічен|наведен|цих)|(обидва|обоє)\s+варіант|варіант\S*\s+[А-Д]\s*(,|і|та|й)\s*[А-Д]/iu

/** Для типів з варіантами, що перемішуються: зауваження про варіант, залежний від порядку. */
export function positionalOptionProblems(options: string[], keepOrder: boolean): LintProblem[] {
  const found = keepOrder ? null : options.find((option) => POSITIONAL.test(option))
  return found
    ? [
        {
          severity: "error",
          text: `«${found}» — варіант залежить від порядку, а варіанти перемішуються: перепиши його або постав keepOrder: true`,
        },
      ]
    : []
}

const unique = (items: readonly unknown[]) => new Set(items).size === items.length

/** Усі елементи різні — спільна перевірка для варіантів, пунктів, індексів. */
export const uniqueIssue = (
  ctx: z.RefinementCtx,
  items: readonly unknown[],
  path: string,
  message: string
) => {
  if (!unique(items)) ctx.addIssue({ code: "custom", path: [path], message })
}
