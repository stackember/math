import type { LintProblem } from "./question/base"
import { moduleOf, type Question } from "./question/registry"

/**
 * Евристики якості завдань — окремо від структурної схеми.
 * Загальні для всіх типів — у списку нижче (нове правило = один запис); залежні від типу —
 * метод `lint` модуля типу. `error` застосовується під час збирання (schema.ts),
 * `warn` — лише в перевірці контенту (`npm run check`).
 */
const COMMON_RULES: ((question: Question) => LintProblem[])[] = []

/** Зауваження заданої суворості з поясненням. */
export function lintQuestion(
  question: Question,
  severity: LintProblem["severity"] = "error"
): string[] {
  const problems = [
    ...COMMON_RULES.flatMap((rule) => rule(question)),
    ...(moduleOf(question).lint?.(question) ?? []),
  ]
  return problems.filter((p) => p.severity === severity).map((p) => p.text)
}
