/**
 * Результати тренажерів у localStorage браузера.
 * Тільки для зручності: якщо сховище недоступне (приватний режим), просто нічого не зберігаємо.
 */
export interface Score {
  score: number
  total: number
}

export interface TrainerStats {
  best?: Score
  last?: Score
}

export const storageKey = (trainerId: string) => `trainer:${trainerId}`

export function loadStats(key: string): TrainerStats {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") as TrainerStats
  } catch {
    return {}
  }
}

export function saveResult(key: string, result: Score): TrainerStats {
  const stats = loadStats(key)
  const isBest = !stats.best || result.score / result.total > stats.best.score / stats.best.total
  const next: TrainerStats = { best: isBest ? result : stats.best, last: result }
  try {
    localStorage.setItem(key, JSON.stringify(next))
  } catch {
    // сховище недоступне — результат просто не збережеться
  }
  return next
}
