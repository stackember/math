import { ArrowLeft, Dumbbell } from "lucide-react"
import Link from "next/link"

import { source } from "@/content/source"
import { isPractice, practiceSlugs, theorySlugs, topicOf } from "@/content/topic"
import { cn } from "@/lib/utils"

/**
 * Перехід між теорією і практикою однієї теми: практика — сусідній файл practice.mdx.
 * На теорії без практики кнопки немає.
 */
export function TopicSwitch({ slugs }: { slugs: readonly string[] }) {
  const topic = topicOf(slugs)
  if (!topic) return null

  const toPractice = !isPractice(slugs)
  const pair = source.getPage(toPractice ? practiceSlugs(topic) : theorySlugs(topic))
  if (!pair) return null

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
