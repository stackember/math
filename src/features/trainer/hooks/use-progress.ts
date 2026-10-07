import { useState } from "react"

import { localProgressStore, type ProgressStore, type TrainerResult } from "../model/progress"

/** Прогрес теми зі сховища (localStorage; у тестах — будь-який `ProgressStore`). */
export function useProgress(trainerId: string, store: ProgressStore = localProgressStore) {
  const [progress, setProgress] = useState(() => store.load(trainerId))
  const record = (result: TrainerResult) => setProgress(store.save(trainerId, result))
  return { progress, record }
}
