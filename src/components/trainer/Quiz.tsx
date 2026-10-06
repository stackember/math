import { useEffect, useReducer, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { isAnswered } from "@/lib/quiz/check"
import type { RenderedQuiz } from "@/lib/quiz/render"
import {
  createSession,
  currentStep,
  isFinished,
  isLastStep,
  score,
  sessionReducer,
  wrongQuestions,
} from "@/lib/quiz/session"
import { loadStats, saveResult, type TrainerStats } from "@/lib/quiz/storage"
import { cn } from "@/lib/utils"

import { ChoiceAnswer } from "./ChoiceAnswer"
import { Feedback, Warning } from "./Feedback"
import { MatchAnswer } from "./MatchAnswer"
import { Results } from "./Results"
import { Html, LEVELS } from "./shared"
import { ShortAnswer } from "./ShortAnswer"

interface Props {
  quiz: RenderedQuiz
  storageKey: string
}

export default function Quiz({ quiz, storageKey }: Props) {
  const [session, dispatch] = useReducer(sessionReducer, quiz.questions, (questions) =>
    createSession(questions, "full")
  )
  const [stats, setStats] = useState<TrainerStats>(() => loadStats(storageKey))
  const cardRef = useRef<HTMLDivElement>(null)
  const mainButtonRef = useRef<HTMLButtonElement>(null)

  const finished = isFinished(session)
  const step = finished ? null : currentStep(session)
  const correct = session.results[session.index]

  const start = (mode: "full" | "retry") => {
    const questions = mode === "full" ? quiz.questions : wrongQuestions(session)
    dispatch({ type: "start", session: createSession(questions, mode) })
  }

  const check = () => dispatch({ type: "check" })

  const next = () => {
    if (isLastStep(session) && session.mode === "full") {
      setStats(saveResult(storageKey, { score: score(session), total: session.steps.length }))
    }
    dispatch({ type: "next" })
  }

  // Після перевірки — фокус на «Далі», щоб Enter вів далі.
  useEffect(() => {
    if (session.checked) mainButtonRef.current?.focus({ preventScroll: true })
  }, [session.checked])

  // Нове завдання або результат: якщо картка поїхала вгору — повертаємо її в кадр.
  useEffect(() => {
    const card = cardRef.current
    if (card && card.getBoundingClientRect().top < 0) card.scrollIntoView({ behavior: "smooth" })
  }, [session.index, session.mode])

  // Клавіатура: Enter — перевірити/далі, 1–5 — обрати варіант.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (finished || target === mainButtonRef.current || target.closest("a, summary")) return
      if (event.key === "Enter") {
        event.preventDefault()
        mainButtonRef.current?.click()
      } else if (
        step?.question.type === "choice" &&
        !session.checked &&
        target.tagName !== "INPUT"
      ) {
        const option = step.order[Number(event.key) - 1]
        if (option !== undefined) dispatch({ type: "choose", option })
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [finished, step, session.checked])

  return (
    <div className="space-y-3">
      {stats.best && stats.last && (
        <p className="text-sm text-muted-foreground">
          Найкращий результат: {stats.best.score}/{stats.best.total} · останній: {stats.last.score}/
          {stats.last.total}
        </p>
      )}

      <Card ref={cardRef} className="scroll-mt-20 gap-5 py-5 [--card-spacing:--spacing(5)]">
        {finished || !step ? (
          <Results
            session={session}
            tags={quiz.tags}
            onRetryWrong={() => start("retry")}
            onRestart={() => start("full")}
          />
        ) : (
          <>
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  {session.mode === "full" ? "Питання" : "Повторення помилок"} {session.index + 1} /{" "}
                  {session.steps.length}
                </span>
                <Badge
                  variant={
                    step.question.level === 3
                      ? "destructive"
                      : step.question.level === 2
                        ? "default"
                        : "secondary"
                  }
                >
                  {"★".repeat(step.question.level)} {LEVELS[step.question.level]}
                </Badge>
              </div>

              <div className="flex gap-1" aria-hidden="true">
                {session.steps.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      session.results[i] === true && "bg-success",
                      session.results[i] === false && "bg-destructive",
                      session.results[i] === undefined &&
                        (i === session.index ? "bg-primary" : "bg-muted")
                    )}
                  />
                ))}
              </div>

              <Html
                as="div"
                html={step.question.q}
                className="text-lg leading-snug font-semibold text-foreground"
              />
            </CardHeader>

            <CardContent key={`${session.mode}-${session.index}`}>
              {step.question.type === "choice" && session.draft.type === "choice" && (
                <ChoiceAnswer
                  question={step.question}
                  order={step.order}
                  selected={session.draft.choice}
                  checked={session.checked}
                  onSelect={(option) => dispatch({ type: "choose", option })}
                />
              )}
              {step.question.type === "match" && session.draft.type === "match" && (
                <MatchAnswer
                  question={step.question}
                  selected={session.draft.match}
                  checked={session.checked}
                  onSelect={(row, column) => dispatch({ type: "match", row, column })}
                />
              )}
              {step.question.type === "short" && session.draft.type === "short" && (
                <ShortAnswer
                  value={session.draft.value}
                  checked={session.checked}
                  correct={correct === true}
                  onChange={(value) => dispatch({ type: "input", value })}
                />
              )}

              {session.warning && <Warning text={session.warning} />}
              {session.checked && <Feedback step={step} correct={correct === true} />}
            </CardContent>

            <CardFooter className="justify-end border-t-0 bg-transparent">
              <Button
                ref={mainButtonRef}
                size="lg"
                className="px-5 text-base"
                disabled={!session.checked && !isAnswered(session.draft)}
                onClick={session.checked ? next : check}
              >
                {session.checked ? (isLastStep(session) ? "Результат" : "Далі →") : "Перевірити"}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}
