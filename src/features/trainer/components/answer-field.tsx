import { select } from "../model/question/choice"
import { pick } from "../model/question/match"
import { updateDraft, type Draft } from "../model/question/registry"
import { input } from "../model/question/short"
import type { Step } from "../model/session"
import { ChoiceAnswer } from "./choice-answer"
import { MatchAnswer } from "./match-answer"
import { ShortAnswer } from "./short-answer"

interface Props {
  step: Step
  draft: Draft
  checked: boolean
  correct: boolean
  onAnswer: (update: (draft: Draft) => Draft) => void
}

/**
 * Поле відповіді за типом завдання — єдине місце в інтерфейсі, де тип розгалужується.
 * Новий тип завдання: компонент поруч + гілка тут (TypeScript вимагатиме її через `never`).
 */
export function AnswerField({ step, draft, checked, correct, onAnswer }: Props) {
  const { question } = step
  switch (question.type) {
    case "choice":
      return draft.type === "choice" ? (
        <ChoiceAnswer
          question={question}
          order={step.order}
          selected={draft.choice}
          checked={checked}
          onSelect={(option) => onAnswer(updateDraft("choice", select(option)))}
        />
      ) : null
    case "match":
      return draft.type === "match" ? (
        <MatchAnswer
          question={question}
          selected={draft.match}
          checked={checked}
          onSelect={(row, column) => onAnswer(updateDraft("match", pick(row, column)))}
        />
      ) : null
    case "short":
      return draft.type === "short" ? (
        <ShortAnswer
          value={draft.value}
          checked={checked}
          correct={correct}
          onChange={(value) => onAnswer(updateDraft("short", input(value)))}
        />
      ) : null
    default:
      return question satisfies never
  }
}
