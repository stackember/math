import type { Session } from "./session"

/** Підсумок проходження за часткою правильних відповідей і режимом. */
export function verdict(share: number, mode: Session["mode"]): string {
  if (mode === "retry") {
    return share === 1
      ? "Помилки виправлено! Тепер пройди весь тест ще раз."
      : "Ще є помилки: перечитай пояснення і спробуй знову."
  }
  if (share === 1) return "Ідеально! Тему засвоєно."
  if (share >= 0.8) return "Добре! Повтори помилки — і буде ідеально."
  if (share >= 0.5) return "Непогано, але варто перечитати теорію."
  return "Повернись до теорії і спробуй ще раз."
}
