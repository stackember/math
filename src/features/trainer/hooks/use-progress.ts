import { useState } from "react"

import { loadStats, saveResult, type Score, type TrainerStats } from "../model/storage"

/** Найкращий і останній результат тренажера в localStorage. */
export function useProgress(key: string, legacyKey?: string) {
  const [stats, setStats] = useState<TrainerStats>(() => loadStats(key, legacyKey))
  const record = (result: Score) => setStats(saveResult(key, result, legacyKey))
  return { stats, record }
}
