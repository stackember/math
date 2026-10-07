import { Radio } from "@base-ui/react/radio"

import { RadioGroup } from "@/shared/ui/radio-group"

import { select } from "../model/question/choice"
import { OptionLetter, optionRowClass } from "./option-row"
import { Html, type AnswerProps, type Mark } from "./shared"

function markOf(option: number, { question, draft, checked }: AnswerProps<"choice">): Mark {
  if (!checked) return option === draft.choice ? "selected" : "idle"
  if (option === question.answer) return "correct"
  return option === draft.choice ? "wrong" : "idle"
}

/**
 * Варіанти як група радіокнопок (Base UI): стрілки й пробіл працюють самі.
 * Після перевірки група лише для читання: видно, що обрано й де правильна відповідь.
 * `data-option` — індекс варіанта у frontmatter, `data-mark` — стан (для e2e, незалежно від перемішування).
 */
export function ChoiceAnswer(props: AnswerProps<"choice">) {
  const { question, order, draft, profile, checked, onAnswer } = props
  return (
    <RadioGroup
      aria-label="Варіанти відповіді"
      data-answer="choice"
      value={draft.choice === null ? null : String(draft.choice)}
      readOnly={checked}
      onValueChange={(value) => onAnswer(select(Number(value)))}
    >
      {order.map((option, position) => {
        const mark = markOf(option, props)
        return (
          <Radio.Root
            key={option}
            value={String(option)}
            data-option={option}
            data-mark={mark}
            className={optionRowClass(mark)}
          >
            <OptionLetter letter={profile.letters[position]} mark={mark} />
            <Html html={question.options[option]} />
          </Radio.Root>
        )
      })}
    </RadioGroup>
  )
}
