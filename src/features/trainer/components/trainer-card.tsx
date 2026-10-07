"use client"

import { useRef } from "react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"

import { useProgress } from "../hooks/use-progress"
import { useStepFocus } from "../hooks/use-step-focus"
import { useTrainerKeyboard } from "../hooks/use-trainer-keyboard"
import { useTrainerSession } from "../hooks/use-trainer-session"
import { isAnswered } from "../model/check"
import type { RenderedTrainer } from "../model/schema"
import { isLastStep } from "../model/session"
import { ChoiceAnswer } from "./choice-answer"
import { Feedback, Warning } from "./feedback"
import { MatchAnswer } from "./match-answer"
import { Results } from "./results"
import { Html, LEVELS } from "./shared"
import { ShortAnswer } from "./short-answer"

interface Props {
  trainer: RenderedTrainer
  storageKey: string
  legacyStorageKey?: string
}

/** Картка тренажера: композиція hooks (стан, прогрес, клавіатура, фокус) і презентаційних компонентів. */
export function TrainerCard({ trainer, storageKey, legacyStorageKey }: Props) {
  const progress = useProgress(storageKey, legacyStorageKey)
  const t = useTrainerSession(trainer.questions, { onComplete: progress.record })
  const cardRef = useRef<HTMLDivElement>(null)
  const mainButtonRef = useRef<HTMLButtonElement>(null)

  useStepFocus(cardRef, mainButtonRef, {
    index: t.session.index,
    mode: t.session.mode,
    checked: t.checked,
  })
  useTrainerKeyboard(cardRef, {
    enabled: !t.finished,
    onEnter: () => (t.checked ? t.next() : t.check()),
    onDigit: (digit) => {
      if (t.step?.question.type !== "choice" || t.checked) return
      const option = t.step.order[digit - 1]
      if (option !== undefined) t.choose(option)
    },
  })

  const { session, step } = t
  const { stats } = progress

  return (
    <div className="space-y-3">
      {stats.best && stats.last && (
        <p className="text-sm text-muted-foreground">
          Найкращий результат: {stats.best.score}/{stats.best.total} · останній: {stats.last.score}/
          {stats.last.total}
        </p>
      )}

      <Card
        ref={cardRef}
        tabIndex={-1}
        className="scroll-mt-20 gap-5 py-5 outline-none [--card-spacing:--spacing(5)]"
      >
        {!step ? (
          <Results
            session={session}
            tags={trainer.tags}
            onRetryWrong={t.retryWrong}
            onRestart={t.restart}
          />
        ) : (
          <>
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  {session.mode === "full" ? "Завдання" : "Повторення помилок"} {session.index + 1}{" "}
                  / {session.steps.length}
                </span>
                <Badge variant={LEVELS[step.question.level].variant}>
                  {"★".repeat(step.question.level)} {LEVELS[step.question.level].label}
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
                  checked={t.checked}
                  onSelect={t.choose}
                />
              )}
              {step.question.type === "match" && session.draft.type === "match" && (
                <MatchAnswer
                  question={step.question}
                  selected={session.draft.match}
                  checked={t.checked}
                  onSelect={t.match}
                />
              )}
              {step.question.type === "short" && session.draft.type === "short" && (
                <ShortAnswer
                  value={session.draft.value}
                  checked={t.checked}
                  correct={t.correct}
                  onChange={t.input}
                />
              )}

              {session.warning && <Warning text={session.warning} />}
              {t.checked && <Feedback step={step} correct={t.correct} />}
            </CardContent>

            <CardFooter className="justify-end border-t-0 bg-transparent">
              <Button
                ref={mainButtonRef}
                size="lg"
                className="px-5 text-base"
                disabled={!t.checked && !isAnswered(session.draft)}
                onClick={t.checked ? t.next : t.check}
              >
                {t.checked ? (isLastStep(session) ? "Результат" : "Далі →") : "Перевірити"}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}
