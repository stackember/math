"use client"

import { useMounted } from "../hooks/use-mounted"
import type { RenderedTrainer } from "../model/schema"
import { TrainerCard } from "./trainer-card"

export interface TrainerProps {
  /** Дані тренажера з frontmatter, уже відрендерені під час збирання (HTML замість Markdown). */
  trainer: RenderedTrainer
  /** Ключ збережених результатів у localStorage. */
  storageKey: string
  /** Ключ до переїзду сторінок, щоб не пропав прогрес. */
  legacyStorageKey?: string
}

/**
 * Вхід тренажера для сторінки практики. Картка монтується лише в браузері
 * (порядок завдань випадковий, результати в localStorage), до того — заглушка,
 * однакова на сервері й у браузері.
 */
export function Trainer(props: TrainerProps) {
  const mounted = useMounted()

  return (
    <div className="not-prose mt-8">
      {mounted ? (
        <TrainerCard {...props} />
      ) : (
        <p className="text-muted-foreground">Завантаження тренажера…</p>
      )}
    </div>
  )
}
