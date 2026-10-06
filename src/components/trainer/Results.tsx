import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { score, tagStats, wrongQuestions, type Session } from "@/lib/quiz/session"
import { cn } from "@/lib/utils"

import { Html } from "./shared"

interface Props {
  session: Session
  tags: Record<string, string>
  onRetryWrong: () => void
  onRestart: () => void
}

function verdict(share: number, mode: Session["mode"]): string {
  if (mode === "retry") {
    return share === 1
      ? "Помилки виправлено! Тепер пройди весь тест ще раз."
      : "Ще є помилки: перечитай пояснення і спробуй знову."
  }
  if (share === 1) return "Ідеально! Тему засвоєно."
  if (share >= 0.8) return "Добре! Повтори помилки — і буде ідеально."
  if (share >= 0.5) return "Непогано, але варто перечитати теорію."
  return "Повернись до теорії і спробуй ще раз."
}

export function Results({ session, tags, onRetryWrong, onRestart }: Props) {
  const total = session.steps.length
  const correct = score(session)
  const wrong = wrongQuestions(session).length

  return (
    <>
      <CardContent className="space-y-6 py-4 text-center">
        <div>
          <p className="text-6xl font-extrabold text-foreground tabular-nums">
            {correct}
            <span className="text-3xl font-semibold text-muted-foreground"> / {total}</span>
          </p>
          <p className="mt-2 text-base text-muted-foreground">
            {verdict(correct / total, session.mode)}
          </p>
        </div>

        <ul className="space-y-2.5 text-left" aria-label="Результат за правилами">
          {[...tagStats(session)].map(([tag, stat]) => (
            <li
              key={tag}
              className="grid grid-cols-[1fr_5rem_2.5rem] items-center gap-3 text-sm sm:grid-cols-[1fr_8rem_2.5rem]"
            >
              <Html html={tags[tag] ?? tag} className="text-foreground" />
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
          ))}
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
