import { cn } from "@/lib/utils"

export const LETTERS = ["А", "Б", "В", "Г", "Д"] as const

export const LEVELS = {
  1: "легке",
  2: "рівень НМТ",
  3: "пастка",
} as const

/** Стан варіанта/клітинки після вибору та перевірки. */
export type Mark = "idle" | "selected" | "correct" | "missed" | "wrong"

/**
 * HTML, згенерований під час збирання з нашого ж Markdown (див. lib/quiz/render.ts),
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
