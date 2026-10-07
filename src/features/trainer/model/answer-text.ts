import { formatNumber } from "./check"
import { EXAM } from "./exam"
import type { Step } from "./session"

/**
 * Правильна відповідь так, як її записали б на бланку: «В) √12», «1–А, 2–Б, 3–В», «−2,5».
 * Літера вибору — відносно показаного (перемішаного) порядку варіантів.
 * Повертає HTML, бо тексти варіантів уже відрендерені під час збирання.
 */
export function answerHtml({ question, order }: Step): string {
  switch (question.type) {
    case "choice":
      return `${EXAM.letters[order.indexOf(question.answer)]}) ${question.options[question.answer]}`
    case "match":
      return question.answer.map((column, row) => `${row + 1}–${EXAM.letters[column]}`).join(", ")
    case "short":
      return formatNumber(question.answer)
  }
}
