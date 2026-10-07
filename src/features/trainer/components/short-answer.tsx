import { useEffect, useRef } from "react"

import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

interface Props {
  value: string
  checked: boolean
  correct: boolean
  onChange: (value: string) => void
}

export function ShortAnswer({ value, checked, correct, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  // Компонент монтується заново для кожного завдання — одразу ставимо курсор у поле.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="space-y-2">
      {/* Без inputMode="decimal": на iOS у такій клавіатурі немає мінуса. */}
      <Input
        ref={ref}
        value={value}
        disabled={checked}
        autoComplete="off"
        aria-label="Відповідь"
        placeholder="Відповідь — число"
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-11 max-w-60 text-lg md:text-lg",
          checked &&
            (correct ? "border-success bg-success-low" : "border-destructive bg-destructive-low"),
          "disabled:text-foreground disabled:opacity-100"
        )}
      />
      <p className="text-sm text-muted-foreground">Десятковий дріб — через кому або крапку.</p>
    </div>
  )
}
