import { Radio } from "@base-ui/react/radio"

import { cn } from "@/shared/lib/utils"
import { RadioGroup } from "@/shared/ui/radio-group"

import type { RenderedQuestion } from "../model/question/registry"
import { Html, LETTERS, type Mark } from "./shared"

type ChoiceQuestion = Extract<RenderedQuestion, { type: "choice" }>

interface Props {
  question: ChoiceQuestion
  /** Порядок показу: індекси `question.options`. */
  order: number[]
  selected: number | null
  checked: boolean
  onSelect: (option: number) => void
}

const optionStyles: Record<Mark, string> = {
  idle: "",
  selected: "border-primary bg-accent",
  correct: "border-success bg-success-low",
  missed: "border-success bg-success-low",
  wrong: "border-destructive bg-destructive-low",
}

const letterStyles: Record<Mark, string> = {
  idle: "bg-accent text-accent-foreground",
  selected: "bg-primary text-primary-foreground",
  correct: "bg-success text-background",
  missed: "bg-success text-background",
  wrong: "bg-destructive text-background",
}

function markOf(option: number, { question, selected, checked }: Props): Mark {
  if (!checked) return option === selected ? "selected" : "idle"
  if (option === question.answer) return "correct"
  return option === selected ? "wrong" : "idle"
}

/**
 * Варіанти А–Д як група радіокнопок (Base UI): стрілки й пробіл працюють самі.
 * Після перевірки група лише для читання: видно, що обрано й де правильна відповідь.
 * `data-option` — індекс варіанта у frontmatter (для e2e, незалежно від перемішування).
 */
export function ChoiceAnswer(props: Props) {
  const { question, order, selected, checked, onSelect } = props
  return (
    <RadioGroup
      aria-label="Варіанти відповіді"
      data-answer="choice"
      value={selected === null ? null : String(selected)}
      readOnly={checked}
      onValueChange={(value) => onSelect(Number(value))}
    >
      {order.map((option, position) => {
        const mark = markOf(option, props)
        return (
          <Radio.Root
            key={option}
            value={String(option)}
            data-option={option}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-base text-foreground transition-colors outline-none",
              "not-data-readonly:cursor-pointer not-data-readonly:hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50",
              optionStyles[mark]
            )}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold",
                letterStyles[mark]
              )}
            >
              {LETTERS[position]}
            </span>
            <Html html={question.options[option]} />
          </Radio.Root>
        )
      })}
    </RadioGroup>
  )
}
