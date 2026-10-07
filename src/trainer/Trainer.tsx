import "server-only"

import { renderTrainer } from "./render"
import type { TrainerData } from "./schema"
import { TrainerLoader } from "./ui/TrainerLoader"

/**
 * Тренажер сторінки практики: формули рендеряться на сервері (під час збирання),
 * готові дані йдуть клієнтському компоненту. Сторінка (src/app/[[...slug]]/page.tsx)
 * показує його сама, коли у frontmatter є `trainer` — у MDX нічого вставляти не треба.
 */
export async function Trainer({
  data,
  storageKey,
  legacyStorageKey,
}: {
  data: TrainerData
  /** Ключ збережених результатів у localStorage. */
  storageKey: string
  /** Ключ до переїзду сторінок, щоб не пропав прогрес. */
  legacyStorageKey?: string
}) {
  const trainer = await renderTrainer(data)

  return (
    <div className="not-prose mt-8">
      <TrainerLoader
        trainer={trainer}
        storageKey={storageKey}
        legacyStorageKey={legacyStorageKey}
      />
    </div>
  )
}
