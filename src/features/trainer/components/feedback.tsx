import { CircleAlert, CircleCheck, CircleX } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"

import { answerHtml } from "../model/answer-text"
import type { ExamProfile } from "../model/exam/profile"
import type { Step } from "../model/session"
import { Html } from "./shared"

interface Props {
  step: Step
  profile: ExamProfile
  correct: boolean
}

export function Feedback({ step, profile, correct }: Props) {
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
            Неправильно. Відповідь: <Html html={answerHtml(step, profile)} />
          </>
        )}
      </AlertTitle>
      <AlertDescription className="text-base text-foreground">
        <Html as="div" html={step.question.why} />
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
