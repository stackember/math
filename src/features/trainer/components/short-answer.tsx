import { useEffect, useRef } from "react"

import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

import { input } from "../model/question/short"
import type { AnswerProps } from "./shared"

export function ShortAnswer({ draft, checked, correct, onAnswer }: AnswerProps<"short">) {
  const ref = useRef<HTMLInputElement>(null)

  // Компонент монтується заново для кожного завдання — одразу ставимо курсор у поле.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="space-y-2" data-answer="short">
      {/* Без inputMode="decimal": на iOS у такій клавіатурі немає мінуса. */}
      <Input
        ref={ref}
        value={draft.value}
        disabled={checked}
        autoComplete="off"
        aria-label="Відповідь"
        placeholder="Відповідь — число"
        onChange={(event) => onAnswer(input(event.target.value))}
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
