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

/** Ключ результатів тренажера: `trainer:<slug теми>` — не залежить від адреси сторінки. */
export const storageKey = (trainerId: string) => `trainer:${trainerId}`

/** `legacyKey` — ключ до переїзду сторінок; читається, якщо за новим ключем ще нічого немає. */
export function loadStats(key: string, legacyKey?: string): TrainerStats {
  try {
    const raw = localStorage.getItem(key) ?? (legacyKey ? localStorage.getItem(legacyKey) : null)
    return JSON.parse(raw ?? "{}") as TrainerStats
  } catch {
    return {}
  }
}

export function saveResult(key: string, result: Score, legacyKey?: string): TrainerStats {
  const stats = loadStats(key, legacyKey)
  const isBest = !stats.best || result.score / result.total > stats.best.score / stats.best.total
  const next: TrainerStats = { best: isBest ? result : stats.best, last: result }
  try {
    localStorage.setItem(key, JSON.stringify(next))
  } catch {
    // сховище недоступне — результат просто не збережеться
  }
  return next
}
