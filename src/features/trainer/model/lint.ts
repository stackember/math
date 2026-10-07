import type { Question } from "./question/registry"

/**
 * Евристики якості завдань — окремо від структурної схеми: нове правило = один запис.
 * `error` застосовується під час збирання (schema.ts), `warn` — лише в перевірці контенту.
 */
export interface LintRule {
  id: string
  severity: "error" | "warn"
  description: string
  /** Фрагмент, що порушує правило, або `null`. */
  check(question: Question): string | null
}

/** Варіанти, що залежать від порядку або посилаються на літери, ламаються після перемішування. */
const POSITIONAL =
  /(усі|всі|усе|все)\s+(перелічен|наведен)|жодн\S*\s+(з|із)\s+(перелічен|наведен|цих)|(обидва|обоє)\s+варіант|варіант\S*\s+[А-Д]\s*(,|і|та|й)\s*[А-Д]/iu

const LINT_RULES: LintRule[] = [
  {
    id: "positional-option",
    severity: "error",
    description:
      "варіант залежить від порядку, а варіанти перемішуються: перепиши його або постав keepOrder: true",
    check: (question) =>
      question.type === "choice" && !question.keepOrder
        ? (question.options.find((option) => POSITIONAL.test(option)) ?? null)
        : null,
  },
]

/** Порушення правил заданої суворості з поясненням. */
export function lintQuestion(
  question: Question,
  severity: LintRule["severity"] = "error"
): string[] {
  return LINT_RULES.filter((rule) => rule.severity === severity).flatMap((rule) => {
    const found = rule.check(question)
    return found === null ? [] : [`«${found}» — ${rule.description}`]
  })
}
