import { useEffect, useRef } from "react"

import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

import { input } from "../model/question/short"
import type { AnswerProps } from "./shared"

/**
 * Одне поле або кілька (структурована відповідь НМТ) — по одному на число в `answer`.
 * `data-field` — індекс поля; підпис «Відповідь» для одного поля, «Відповідь 1», «Відповідь 2» — для кількох.
 */
export function ShortAnswer({ draft, checked, correct, onAnswer }: AnswerProps<"short">) {
  const first = useRef<HTMLInputElement>(null)
  const several = draft.values.length > 1

  // Компонент монтується заново для кожного завдання — одразу ставимо курсор у перше поле.
  useEffect(() => {
    first.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="space-y-2" data-answer="short">
      <div className="flex flex-wrap gap-3">
        {draft.values.map((value, field) => (
          <label key={field} className="flex items-center gap-2">
            {several && (
              <span className="text-sm font-semibold text-muted-foreground">{field + 1}</span>
            )}
            {/* Без inputMode="decimal": на iOS у такій клавіатурі немає мінуса. */}
            <Input
              ref={field === 0 ? first : undefined}
              value={value}
              disabled={checked}
              autoComplete="off"
              aria-label={several ? `Відповідь ${field + 1}` : "Відповідь"}
              placeholder={several ? "Число" : "Відповідь — число"}
              data-field={field}
              onChange={(event) => onAnswer(input(field, event.target.value))}
              className={cn(
                "h-11 text-lg md:text-lg",
                several ? "max-w-36" : "max-w-60",
                checked &&
                  (correct
                    ? "border-success bg-success-low"
                    : "border-destructive bg-destructive-low"),
                "disabled:text-foreground disabled:opacity-100"
              )}
            />
          </label>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Десятковий дріб — через кому або крапку.
        {several && " Що в яке поле — сказано в умові."}
      </p>
    </div>
  )
}
