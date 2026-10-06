import { ArrowLeft, Dumbbell } from "lucide-react"
import Link from "next/link"

import { source } from "@/lib/source"
import { pairSlugs, type Topic } from "@/lib/topics"
import { cn } from "@/lib/utils"

/**
 * Перехід між теорією і практикою однієї теми.
 * Пара шукається за однаковою назвою файлу: theory/<slug> ↔ practice/<slug>.
 */
export function TopicSwitch({ topic }: { topic: Topic }) {
  const pair = source.getPage(pairSlugs(topic))
  if (!pair) return null

  const toPractice = topic.section === "theory"

  return (
    <Link
      href={pair.url}
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
        toPractice
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/85"
          : "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {toPractice ? (
        <>
          <Dumbbell className="size-4" aria-hidden />
          Практика
        </>
      ) : (
        <>
          <ArrowLeft className="size-4" aria-hidden />
          Теорія
        </>
      )}
    </Link>
  )
}
