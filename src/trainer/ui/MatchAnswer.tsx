import type { RenderedQuestion } from "@/lib/quiz/render"
import { cn } from "@/lib/utils"

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
  idle: "border-border bg-background enabled:hover:border-primary",
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

/** Списки «1–3» і «А–Д» + сітка відповідей, як у бланку НМТ. */
export function MatchAnswer(props: Props) {
  const { question, checked, onSelect } = props
  return (
    <div className="space-y-5">
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

      <table className="mx-auto border-separate border-spacing-1.5">
        <thead>
          <tr>
            <th />
            {question.right.map((_, column) => (
              <th key={column} scope="col" className="text-xs font-semibold text-muted-foreground">
                {LETTERS[column]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {question.left.map((_, row) => (
            <tr key={row}>
              <th scope="row" className="pr-1 text-xs font-semibold text-muted-foreground">
                {row + 1}
              </th>
              {question.right.map((_, column) => (
                <td key={column}>
                  <button
                    type="button"
                    aria-label={`${row + 1} — ${LETTERS[column]}`}
                    aria-pressed={props.selected[row] === column}
                    disabled={checked}
                    onClick={() => onSelect(row, column)}
                    className={cn(
                      "block size-9 rounded-md border-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 enabled:cursor-pointer",
                      cellStyles[markOf(row, column, props)]
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
