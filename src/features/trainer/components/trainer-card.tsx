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
import { profileOf } from "../model/exam/registry"
import { moduleOf, updateDraft } from "../model/question/registry"
import type { RenderedTrainer } from "../model/schema"
import { isLastStep } from "../model/session"
import { AnswerField } from "./answer-field"
import { Feedback, Warning } from "./feedback"
import { Results } from "./results"
import { Html } from "./shared"

interface Props {
  trainer: RenderedTrainer
  trainerId: string
}

/** Картка тренажера: композиція hooks (стан, прогрес, клавіатура, фокус) і презентаційних компонентів. */
export function TrainerCard({ trainer, trainerId }: Props) {
  const profile = profileOf(trainer.exam)
  const { progress, record } = useProgress(trainerId)
  const t = useTrainerSession(trainer.questions, { onComplete: record })
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
    // цифра означає те, що визначив модуль типу завдання (обрати, перемкнути); типи без цифр її ігнорують
    onDigit: (digit) => {
      if (!t.step || t.checked) return
      const { question, order } = t.step
      const update = moduleOf(question).digit?.(question, order, digit)
      if (update) t.answer(updateDraft(question.type, update))
    },
  })

  const { session, step } = t
  const answered = step ? moduleOf(step.question).isAnswered(session.draft) : false

  return (
    <div className="space-y-3">
      {progress.best && progress.last && (
        <p className="text-sm text-muted-foreground">
          Найкращий результат: {progress.best.score}/{progress.best.total} · останній:{" "}
          {progress.last.score}/{progress.last.total}
        </p>
      )}

      <Card
        ref={cardRef}
        tabIndex={-1}
        data-question={step?.question.index}
        data-topic={step?.question.topic}
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
                <Badge variant={profile.levels[step.question.level].variant}>
                  {"★".repeat(step.question.level)} {profile.levels[step.question.level].label}
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
              {step.question.figureHtml && <Html as="div" html={step.question.figureHtml} />}
            </CardHeader>

            <CardContent key={`${session.mode}-${session.index}`}>
              <AnswerField
                step={step}
                draft={session.draft}
                profile={profile}
                checked={t.checked}
                correct={t.correct}
                onAnswer={t.answer}
              />

              {session.warning && <Warning text={session.warning} />}
              {t.checked && <Feedback step={step} profile={profile} correct={t.correct} />}
            </CardContent>

            <CardFooter className="justify-end border-t-0 bg-transparent">
              <Button
                ref={mainButtonRef}
                size="lg"
                className="px-5 text-base"
                disabled={!t.checked && !answered}
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
