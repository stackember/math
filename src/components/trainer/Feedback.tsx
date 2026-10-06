import { CircleAlert, CircleCheck, CircleX } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatNumber } from "@/lib/quiz/check"
import type { RenderedQuestion } from "@/lib/quiz/render"
import type { Step } from "@/lib/quiz/session"
import { cn } from "@/lib/utils"

import { Html, LETTERS } from "./shared"

/** Правильна відповідь у вигляді HTML, як її записали б на бланку. */
function answerHtml({ question, order }: Step): string {
  switch (question.type) {
    case "choice":
      return `${LETTERS[order.indexOf(question.answer)]}) ${question.options[question.answer]}`
    case "match":
      return question.answer.map((column, row) => `${row + 1}–${LETTERS[column]}`).join(", ")
    case "short":
      return formatNumber(question.answer)
  }
}

export function Feedback({ step, correct }: { step: Step; correct: boolean }) {
  const question: RenderedQuestion = step.question
  return (
    <Alert
      className={cn(
        "mt-5 border-l-4 px-4 py-3",
        correct ? "border-success bg-success-low" : "border-destructive bg-destructive-low"
      )}
    >
      {correct ? (
        <CircleCheck className="text-success" />
      ) : (
        <CircleX className="text-destructive" />
      )}
      <AlertTitle className="text-base font-semibold text-foreground">
        {correct ? (
          "Правильно"
        ) : (
          <>
            Неправильно. Відповідь: <Html html={answerHtml(step)} />
          </>
        )}
      </AlertTitle>
      <AlertDescription className="text-base text-foreground">
        <Html html={question.why} />
      </AlertDescription>
    </Alert>
  )
}

export function Warning({ text }: { text: string }) {
  return (
    <Alert className="mt-5 border-l-4 border-warning bg-warning-low px-4 py-3">
      <CircleAlert className="text-warning" />
      <AlertTitle className="text-base text-foreground">{text}</AlertTitle>
    </Alert>
  )
}
