import { moduleOf } from "./question/registry"
import type { Step } from "./session"

/**
 * Правильна відповідь так, як її записали б на бланку: «В) √12», «1–А, 2–Б, 3–В», «−2,5».
 * Літера вибору — відносно показаного (перемішаного) порядку варіантів.
 * Повертає HTML, бо тексти варіантів уже відрендерені під час збирання.
 */
export const answerHtml = ({ question, order }: Step): string =>
  moduleOf(question).answerHtml(question, order)
