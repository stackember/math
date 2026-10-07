import { useEffect, useRef, type RefObject } from "react"

export interface StepFocusState {
  index: number
  mode: string
  checked: boolean
}

/**
 * Фокус і прокрутка тренажера:
 * - після перевірки фокус іде на головну кнопку, щоб Enter вів далі;
 * - нове завдання або результат: картка повертається в кадр і отримує фокус
 *   (клавіатура й читач екрана лишаються в тренажері, а не падають на body).
 * При першому показі фокус не чіпаємо — сторінка щойно відкрилась.
 */
export function useStepFocus(
  cardRef: RefObject<HTMLElement | null>,
  buttonRef: RefObject<HTMLElement | null>,
  { index, mode, checked }: StepFocusState
) {
  useEffect(() => {
    if (checked) buttonRef.current?.focus({ preventScroll: true })
  }, [buttonRef, checked])

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const card = cardRef.current
    if (!card) return
    if (card.getBoundingClientRect().top < 0) card.scrollIntoView?.({ behavior: "smooth" })
    // поле відповіді вже взяло фокус саме (коротка відповідь) — не відбирати
    const active = document.activeElement
    if (active instanceof HTMLInputElement && card.contains(active)) return
    card.focus({ preventScroll: true })
  }, [cardRef, index, mode])
}
