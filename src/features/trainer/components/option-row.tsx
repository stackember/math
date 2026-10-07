import { cn } from "@/shared/lib/utils"

import type { Mark } from "./shared"

/**
 * Рядок варіанта з літерою — спільний вигляд для типів із варіантами А–Д (choice, multi).
 * Кореневий елемент різний (радіокнопка чи прапорець), тож тут лише класи й літера.
 */
const rowStyles: Record<Mark, string> = {
  idle: "",
  selected: "border-primary bg-accent",
  correct: "border-success bg-success-low",
  missed: "border-dashed border-success bg-success-low",
  wrong: "border-destructive bg-destructive-low",
}

const letterStyles: Record<Mark, string> = {
  idle: "bg-accent text-accent-foreground",
  selected: "bg-primary text-primary-foreground",
  correct: "bg-success text-background",
  missed: "bg-success text-background",
  wrong: "bg-destructive text-background",
}

export const optionRowClass = (mark: Mark) =>
  cn(
    "flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-base text-foreground transition-colors outline-none",
    "not-data-readonly:cursor-pointer not-data-readonly:hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50",
    rowStyles[mark]
  )

export function OptionLetter({ letter, mark }: { letter: string; mark: Mark }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold",
        letterStyles[mark]
      )}
    >
      {letter}
    </span>
  )
}
