import { useEffect, useMemo, useRef, useState } from "react"

/**
 * Активне значення, яке скидається із затримкою («hover intent»):
 * якщо за цей час показали інше значення — скидання скасовується, без мерехтіння.
 */
export function useDelayedClear<T>(delayMs: number) {
  const [value, setValue] = useState<T | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const handlers = useMemo(
    () => ({
      show(next: T) {
        window.clearTimeout(timer.current)
        setValue(next)
      },
      clearSoon() {
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setValue(null), delayMs)
      },
    }),
    [delayMs]
  )

  return [value, handlers] as const
}
