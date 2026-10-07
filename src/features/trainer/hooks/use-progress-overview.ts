import { useState } from "react"

import { overview, type Overview, type TopicInfo } from "../model/overview"
import { localProgressStore, type ProgressStore } from "../model/progress"

/** Зведення прогресу за темами зі сховища — читається один раз при монтуванні (лише в браузері). */
export function useProgressOverview(
  topics: TopicInfo[],
  mixedId: string,
  store: ProgressStore = localProgressStore
): Overview {
  const [state] = useState(() => overview(topics, store.load, mixedId))
  return state
}
