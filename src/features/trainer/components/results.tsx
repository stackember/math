import { Button } from "@/shared/ui/button"
import { CardContent, CardFooter } from "@/shared/ui/card"

import { score, tagStats, wrongQuestions, type Session } from "../model/session"
import { verdict } from "../model/verdict"
import { RuleBars } from "./rule-bars"

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
  const rules = Object.entries(tags).flatMap(([tag, label]) => {
    const stat = stats.get(tag)
    return stat ? [{ tag, label, ...stat }] : []
  })

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

        <RuleBars rules={rules} label="Результат за правилами" />
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
