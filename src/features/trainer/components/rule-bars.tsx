import { cn } from "@/shared/lib/utils"

import type { TagStat } from "../model/session"
import { Html } from "./shared"

export interface RuleRow extends TagStat {
  tag: string
  /** Назва правила (HTML). */
  label: string
}

/** Правила з смужкою «правильно/усього» — у результатах тренажера й на сторінці прогресу. */
export function RuleBars({ rules, label }: { rules: RuleRow[]; label: string }) {
  return (
    <ul className="space-y-2.5 text-left" aria-label={label}>
      {rules.map((rule) => (
        <li
          key={rule.tag}
          className="grid grid-cols-[1fr_5rem_2.5rem] items-center gap-3 text-sm sm:grid-cols-[1fr_8rem_2.5rem]"
        >
          <Html html={rule.label} className="text-foreground" />
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span
              className={cn(
                "block h-full rounded-full",
                rule.total > 0 && rule.correct === rule.total ? "bg-success" : "bg-destructive"
              )}
              style={{ width: `${rule.total === 0 ? 0 : (rule.correct / rule.total) * 100}%` }}
            />
          </span>
          <span className="text-right text-muted-foreground tabular-nums">
            {rule.correct}/{rule.total}
          </span>
        </li>
      ))}
    </ul>
  )
}
