import { Radio } from "@base-ui/react/radio"

import { cn } from "@/shared/lib/utils"
import { RadioGroup } from "@/shared/ui/radio-group"

import type { RenderedQuestion } from "../model/question/registry"
import { Html, LETTERS, type Mark } from "./shared"

type MatchQuestion = Extract<RenderedQuestion, { type: "match" }>

interface Props {
  question: MatchQuestion
  /** `selected[row]` — обрана колонка (індекс у `right`) або `null`. */
  selected: (number | null)[]
  checked: boolean
  onSelect: (row: number, column: number) => void
}

const cellStyles: Record<Mark, string> = {
  idle: "border-border bg-background not-data-readonly:hover:border-primary",
  selected: "border-primary bg-primary",
  correct: "border-success bg-success",
  missed: "border-dashed border-success bg-success-low",
  wrong: "border-destructive bg-destructive",
}

function markOf(row: number, column: number, { question, selected, checked }: Props): Mark {
  const isSelected = selected[row] === column
  if (!checked) return isSelected ? "selected" : "idle"
  const isAnswer = question.answer[row] === column
  if (isAnswer) return isSelected ? "correct" : "missed"
  return isSelected ? "wrong" : "idle"
}

/**
 * Списки «1–3» і «А–Д» + сітка відповідей, як у бланку НМТ: кожен рядок — своя група радіокнопок.
 * `data-row` / `data-option` — індекси з frontmatter (для e2e).
 */
export function MatchAnswer(props: Props) {
  const { question, selected, checked, onSelect } = props
  const columns = { gridTemplateColumns: `1.5rem repeat(${question.right.length}, 2.25rem)` }

  return (
    <div className="space-y-5" data-answer="match">
      <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <ol className="space-y-1.5">
          {question.left.map((item, row) => (
            <li key={row} className="flex items-baseline gap-3">
              <span className="w-4 shrink-0 font-semibold text-primary">{row + 1}</span>
              <Html html={item} />
            </li>
          ))}
        </ol>
        <ol className="space-y-1.5">
          {question.right.map((item, column) => (
            <li key={column} className="flex items-baseline gap-3">
              <span className="w-4 shrink-0 font-semibold text-primary">{LETTERS[column]}</span>
              <Html html={item} />
            </li>
          ))}
        </ol>
      </div>

      <div className="mx-auto w-fit space-y-1.5">
        <div
          className="grid items-center gap-1.5 text-center text-xs font-semibold text-muted-foreground"
          style={columns}
          aria-hidden="true"
        >
          <span />
          {question.right.map((_, column) => (
            <span key={column}>{LETTERS[column]}</span>
          ))}
        </div>
        {question.left.map((_, row) => (
          <RadioGroup
            key={row}
            aria-label={`Пункт ${row + 1}`}
            data-row={row}
            className="grid w-auto items-center gap-1.5"
            style={columns}
            value={selected[row] === null ? null : String(selected[row])}
            readOnly={checked}
            onValueChange={(value) => onSelect(row, Number(value))}
          >
            <span className="text-xs font-semibold text-muted-foreground" aria-hidden="true">
              {row + 1}
            </span>
            {question.right.map((_, column) => (
              <Radio.Root
                key={column}
                value={String(column)}
                data-option={column}
                aria-label={`${row + 1} — ${LETTERS[column]}`}
                className={cn(
                  "block size-9 rounded-md border-2 transition-colors outline-none not-data-readonly:cursor-pointer focus-visible:ring-3 focus-visible:ring-ring/50",
                  cellStyles[markOf(row, column, props)]
                )}
              />
            ))}
          </RadioGroup>
        ))}
      </div>
    </div>
  )
}
