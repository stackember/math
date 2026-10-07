import { useEffect, type RefObject } from "react"

export interface TrainerKeys {
  enabled: boolean
  /** Enter: перевірити або йти далі. */
  onEnter: () => void
  /** Цифра 1–9: обрати варіант з таким номером. */
  onDigit: (digit: number) => void
}

/**
 * Клавіатура тренажера. Працює, коли фокус у картці або просто на сторінці (body);
 * не втручається, якщо фокус у меню, пошуку чи будь-якому іншому елементі поза карткою,
 * на кнопках, посиланнях і радіокнопках усередині картки (їх натискає сам браузер),
 * при автоповторі клавіші та з модифікаторами (Cmd/Ctrl/Alt — це команди браузера).
 */
export function useTrainerKeyboard(
  ref: RefObject<HTMLElement | null>,
  { enabled, onEnter, onDigit }: TrainerKeys
) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey)
        return
      const target = event.target instanceof HTMLElement ? event.target : null
      if (!target) return
      const inCard = ref.current?.contains(target) ?? false
      if (!inCard && target !== document.body) return

      if (event.key === "Enter") {
        if (inCard && target.closest("button, a, summary, [role=radio]")) return
        event.preventDefault()
        onEnter()
      } else if (/^[1-9]$/.test(event.key) && target.tagName !== "INPUT") {
        onDigit(Number(event.key))
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [ref, enabled, onEnter, onDigit])
}
