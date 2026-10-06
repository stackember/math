"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

export type SetId = "N" | "Z" | "Q" | "I" | "R"

export interface DiagramItem {
  /** HTML числа (KaTeX) */
  html: string
  /** число простим текстом — для екранних читачів */
  label: string
  /** множини, яким число належить */
  sets: SetId[]
  /** HTML підпису «x ∈ …; x ∉ …» */
  captionHtml: string
}

export interface DiagramSet {
  /** HTML літери множини (KaTeX) */
  letterHtml: string
  name: string
}

interface Props {
  sets: Record<SetId, DiagramSet>
  items: DiagramItem[]
}

const COLORS: Record<SetId, { border: string; tint: string; text: string }> = {
  R: {
    border: "border-zinc-400 dark:border-zinc-500",
    tint: "bg-zinc-500/5",
    text: "text-zinc-600 dark:text-zinc-300",
  },
  Q: {
    border: "border-amber-500",
    tint: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
  },
  Z: {
    border: "border-emerald-500",
    tint: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  N: {
    border: "border-sky-500",
    tint: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
  },
  I: {
    border: "border-rose-500",
    tint: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-400",
  },
}

/**
 * Скільки чекати перед скиданням підсвітки, коли курсор зійшов з числа.
 * Якщо за цей час курсор дійшов до сусіднього числа — скидання скасовується (без мерехтіння).
 */
const CLEAR_DELAY_MS = 150

/** Активне значення, яке скидається із затримкою («hover intent»). */
function useDelayedClear<T>(delayMs: number) {
  const [value, setValue] = useState<T | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const handlers = useMemo(
    () => ({
      show(next: T) {
        window.clearTimeout(timer.current)
        setValue(next)
      },
      clearSoon() {
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setValue(null), delayMs)
      },
    }),
    [delayMs]
  )

  return [value, handlers] as const
}

/**
 * Вкладені множини N ⊂ Z ⊂ Q ⊂ R та I ⊂ R. Наведи / торкнись числа —
 * підсвітяться всі множини, яким воно належить.
 */
export function NumberSetsDiagram({ sets, items }: Props) {
  const [active, { show, clearSoon }] = useDelayedClear<number>(CLEAR_DELAY_MS)
  const activeSets = active === null ? null : new Set(items[active].sets)

  const chips = (home: SetId) =>
    items.map((item, index) =>
      item.sets[0] === home ? (
        <button
          key={index}
          type="button"
          aria-label={item.label}
          aria-pressed={active === index}
          // мишка: підсвітка за курсором; дотик: лишається після торкання
          onPointerEnter={(event) => event.pointerType === "mouse" && show(index)}
          onPointerLeave={(event) => event.pointerType === "mouse" && clearSoon()}
          onFocus={() => show(index)}
          onBlur={clearSoon}
          onClick={() => show(index)}
          className={cn(
            "rounded-md border bg-background px-2 py-0.5 text-base transition-colors duration-100 outline-none",
            "cursor-pointer focus-visible:ring-3 focus-visible:ring-ring/50",
            active === index
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary"
          )}
          dangerouslySetInnerHTML={{ __html: item.html }}
        />
      ) : null
    )

  const box = (id: SetId, children: ReactNode, className?: string) => {
    const state = activeSets === null ? "idle" : activeSets.has(id) ? "member" : "outside"
    return (
      <div
        data-set={id}
        data-state={state}
        className={cn(
          "flex flex-col gap-2 rounded-xl border-2 p-3 transition-colors duration-100",
          state === "outside" ? "border-dashed border-border" : COLORS[id].border,
          state === "member" && COLORS[id].tint,
          className
        )}
      >
        <div
          className={cn(
            "text-sm font-medium transition-colors duration-100",
            state === "outside" ? "text-muted-foreground" : COLORS[id].text
          )}
        >
          <span dangerouslySetInnerHTML={{ __html: sets[id].letterHtml }} /> — {sets[id].name}
        </div>
        <div className="flex flex-wrap items-start gap-2">{children}</div>
      </div>
    )
  }

  return (
    <figure className="not-prose my-6 space-y-3">
      {box(
        "R",
        <>
          {box(
            "Q",
            <>
              {box(
                "Z",
                <>
                  {box("N", chips("N"))}
                  {chips("Z")}
                </>
              )}
              {chips("Q")}
            </>,
            "flex-1"
          )}
          {box("I", chips("I"), "w-full sm:w-auto")}
        </>
      )}
      <figcaption aria-live="polite" className="min-h-7 text-center text-sm text-muted-foreground">
        {active === null ? (
          "Наведи на число або торкнись його — підсвітяться всі множини, яким воно належить."
        ) : (
          <span
            className="text-base text-foreground"
            dangerouslySetInnerHTML={{ __html: items[active].captionHtml }}
          />
        )}
      </figcaption>
    </figure>
  )
}
