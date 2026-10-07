import { Button } from "@/shared/ui/button"
import { CardContent, CardFooter } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"

import { score, tagStats, wrongQuestions, type Session } from "../model/session"
import { verdict } from "../model/verdict"
import { Html } from "./shared"

interface Props {
  session: Session
  /** Правила теми в порядку з frontmatter — у цьому ж порядку показуємо рядки. */
  tags: Record<string, string>
  onRetryWrong: () => void
  onRestart: () => void
}

export function Results({ session, tags, onRetryWrong, onRestart }: Props) {
  const total = session.steps.length
  const correct = score(session)
  const wrong = wrongQuestions(session).length
  const stats = tagStats(session)

  return (
    <>
      <CardContent className="space-y-6 py-4 text-center">
        <div aria-live="polite">
          <p className="text-6xl font-extrabold text-foreground tabular-nums">
            {correct}
            <span className="text-3xl font-semibold text-muted-foreground"> / {total}</span>
          </p>
          <p className="mt-2 text-base text-muted-foreground">
            {verdict(correct / total, session.mode)}
          </p>
        </div>

        <ul className="space-y-2.5 text-left" aria-label="Результат за правилами">
          {Object.keys(tags).flatMap((tag) => {
            const stat = stats.get(tag)
            if (!stat) return []
            return (
              <li
                key={tag}
                className="grid grid-cols-[1fr_5rem_2.5rem] items-center gap-3 text-sm sm:grid-cols-[1fr_8rem_2.5rem]"
              >
                <Html html={tags[tag]} className="text-foreground" />
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      stat.correct === stat.total ? "bg-success" : "bg-destructive"
                    )}
                    style={{ width: `${(stat.correct / stat.total) * 100}%` }}
                  />
                </span>
                <span className="text-right text-muted-foreground tabular-nums">
                  {stat.correct}/{stat.total}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>

      <CardFooter className="justify-center gap-2">
        {wrong > 0 && (
          <Button size="lg" onClick={onRetryWrong}>
            Повторити помилки ({wrong})
          </Button>
        )}
        <Button size="lg" variant={wrong > 0 ? "outline" : "default"} onClick={onRestart}>
          Пройти ще раз
        </Button>
      </CardFooter>
    </>
  )
}
