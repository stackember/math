import type { ExamProfile } from "../model/exam/profile"
import { updateDraft, type Draft } from "../model/question/registry"
import type { Step } from "../model/session"
import { ANSWER_COMPONENTS } from "./answer-registry"
import type { AnswerComponent } from "./shared"

interface Props {
  step: Step
  draft: Draft
  profile: ExamProfile
  checked: boolean
  correct: boolean
  onAnswer: (update: (draft: Draft) => Draft) => void
}

/**
 * Поле відповіді за типом завдання: компонент — з реєстру `answer-registry.tsx`.
 * Єдине місце в інтерфейсі, де конкретний тип стирається до спільних пропсів
 * (дзеркально до `moduleOf` у моделі); чернетка чужого типу не показується.
 */
export function AnswerField({ step, draft, profile, checked, correct, onAnswer }: Props) {
  const { question, order } = step
  if (draft.type !== question.type) return null
  const Answer = ANSWER_COMPONENTS[question.type] as AnswerComponent
  return (
    <Answer
      question={question}
      draft={draft}
      profile={profile}
      order={order}
      checked={checked}
      correct={correct}
      onAnswer={(update) => onAnswer(updateDraft(question.type, update))}
    />
  )
}
