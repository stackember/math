import { cn } from "@/shared/lib/utils"

import { EXAM } from "../model/exam"

/** Літери варіантів і рівні складності — з профілю іспиту. */
export const LETTERS = EXAM.letters
export const LEVELS = EXAM.levels

/** Стан варіанта/клітинки після вибору та перевірки. */
export type Mark = "idle" | "selected" | "correct" | "missed" | "wrong"

/**
 * HTML, згенерований під час збирання з нашого ж Markdown (див. ../model/render.ts),
 * тому вставляти його напряму безпечно.
 */
export function Html({
  html,
  as: Tag = "span",
  className,
}: {
  html: string
  as?: "span" | "div"
  className?: string
}) {
  return (
    <Tag
      className={cn("[&_.katex]:text-[1.05em]", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
