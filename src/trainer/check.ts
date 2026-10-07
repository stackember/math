import type { Question } from "./schema"

/** Відповідь користувача на одне завдання. */
export type Draft =
  | { type: "choice"; choice: number | null }
  | { type: "match"; match: (number | null)[] }
  | { type: "short"; value: string }

export function emptyDraft(question: Question): Draft {
  switch (question.type) {
    case "choice":
      return { type: "choice", choice: null }
    case "match":
      return { type: "match", match: question.left.map(() => null) }
    case "short":
      return { type: "short", value: "" }
  }
}

/**
 * Число з поля «коротка відповідь».
 * Приймає `4`, `−2,5`, `-2.5`, `-5/2`; повертає `null`, якщо це не число.
 */
export function parseNumber(input: string): number | null {
  const s = input.replace(/\s+/g, "").replace(/[−–]/g, "-").replace(",", ".")
  const fraction = /^(-?\d+)\/(\d+)$/.exec(s)
  if (fraction) {
    const denominator = Number(fraction[2])
    return denominator === 0 ? null : Number(fraction[1]) / denominator
  }
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null
}

/** `-2.5` → `−2,5`: як пишуть у підручниках. */
export function formatNumber(value: number): string {
  return String(value).replace("-", "−").replace(".", ",")
}

export function isAnswered(draft: Draft): boolean {
  switch (draft.type) {
    case "choice":
      return draft.choice !== null
    case "match":
      return draft.match.every((cell) => cell !== null)
    case "short":
      return draft.value.trim() !== ""
  }
}

export function isCorrect(question: Question, draft: Draft): boolean {
  if (question.type === "choice" && draft.type === "choice") {
    return draft.choice === question.answer
  }
  if (question.type === "match" && draft.type === "match") {
    return question.answer.every((column, row) => draft.match[row] === column)
  }
  if (question.type === "short" && draft.type === "short") {
    const value = parseNumber(draft.value)
    return value !== null && Math.abs(value - question.answer) < 1e-9
  }
  return false
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Від легких до складних; усередині рівня — випадковий порядок. */
export function orderByLevel<T extends { level: 1 | 2 | 3 }>(
  questions: readonly T[],
  random: () => number = Math.random
): T[] {
  return ([1, 2, 3] as const).flatMap((level) =>
    shuffle(
      questions.filter((q) => q.level === level),
      random
    )
  )
}
