import { Checkbox } from "@base-ui/react/checkbox"

import { toggle } from "../model/question/multi"
import { OptionLetter, optionRowClass } from "./option-row"
import { Html, LETTERS, type AnswerProps, type Mark } from "./shared"

function markOf(option: number, { question, draft, checked }: AnswerProps<"multi">): Mark {
  const chosen = draft.chosen.includes(option)
  if (!checked) return chosen ? "selected" : "idle"
  const right = question.answer.includes(option)
  if (right) return chosen ? "correct" : "missed"
  return chosen ? "wrong" : "idle"
}

/**
 * Варіанти А–Д як прапорці (Base UI): пробіл перемикає, Tab переходить між ними.
 * Після перевірки — лише для читання: обрано правильно (correct), пропущено (missed, пунктир),
 * обрано зайве (wrong). `data-option` — індекс у frontmatter, `data-mark` — стан (для e2e).
 */
export function MultiAnswer(props: AnswerProps<"multi">) {
  const { question, order, draft, checked, onAnswer } = props
  return (
    <div role="group" aria-label="Варіанти відповіді" data-answer="multi" className="grid gap-2">
      {order.map((option, position) => {
        const mark = markOf(option, props)
        return (
          <Checkbox.Root
            key={option}
            checked={draft.chosen.includes(option)}
            readOnly={checked}
            data-option={option}
            data-mark={mark}
            className={optionRowClass(mark)}
            onCheckedChange={() => onAnswer(toggle(option))}
          >
            <OptionLetter letter={LETTERS[position]} mark={mark} />
            <Html html={question.options[option]} />
          </Checkbox.Root>
        )
      })}
    </div>
  )
}
