import type { TagStat } from "./session"

/**
 * Збережений прогрес теми. Сховище — за інтерфейсом `ProgressStore`:
 * зараз це localStorage браузера, у тестах — пам'ять; формат має `version`,
 * щоб старі записи читалися після зміни формату (див. `migrate`).
 */
interface Score {
  score: number
  total: number
}

/** Результат повного проходу тренажера. */
export interface TrainerResult extends Score {
  /** Правильно/усього за кожним правилом теми за цей прохід. */
  tags: Record<string, TagStat>
}

export interface Progress {
  version: 2
  best?: Score
  last?: Score
  /** Накопичено за всі проходи: правильно/усього за кожним правилом теми. */
  tags: Record<string, TagStat>
}

export interface ProgressStore {
  load(trainerId: string): Progress
  /** Записує повний прохід і повертає оновлений прогрес. */
  save(trainerId: string, result: TrainerResult): Progress
}

export const EMPTY_PROGRESS: Progress = { version: 2, tags: {} }

/** Ключ результатів тренажера: `trainer:<slug теми>` — не залежить від адреси сторінки. */
const key = (trainerId: string) => `trainer:${trainerId}`
/** Ключ до переїзду сторінок (content/practice/<slug>): читається, якщо за новим ще нічого немає. */
const legacyKey = (trainerId: string) => `trainer:practice/${trainerId}`

/** Версія 1 (без поля `version`): лише best і last. */
type StoredV1 = Pick<Progress, "best" | "last">

/** Запис будь-якої версії → поточний формат. Зіпсований запис — як порожній. */
function migrate(raw: unknown): Progress {
  if (!raw || typeof raw !== "object") return EMPTY_PROGRESS
  const stored = raw as Partial<Progress> | StoredV1
  if ("version" in stored && stored.version === 2) return { ...EMPTY_PROGRESS, ...stored }
  return { ...EMPTY_PROGRESS, best: stored.best, last: stored.last }
}

const ratio = ({ score, total }: Score) => score / total

/** Мінімум, що потрібен від сховища: Storage браузера або будь-який його замінник. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem">

/**
 * `storage` — функція, бо localStorage береться лише в момент виклику: на сервері його немає,
 * а в приватному режимі сам доступ може кинути помилку — тоді просто нічого не зберігаємо.
 */
export function createProgressStore(storage: () => KeyValueStorage): ProgressStore {
  const read = (k: string): unknown => {
    try {
      const raw = storage().getItem(k)
      return raw === null ? null : JSON.parse(raw)
    } catch {
      return null
    }
  }

  const load = (trainerId: string) => migrate(read(key(trainerId)) ?? read(legacyKey(trainerId)))

  return {
    load,
    save(trainerId, result) {
      const current = load(trainerId)
      const score = { score: result.score, total: result.total }
      const tags = { ...current.tags }
      for (const [tag, stat] of Object.entries(result.tags)) {
        const before = tags[tag] ?? { correct: 0, total: 0 }
        tags[tag] = { correct: before.correct + stat.correct, total: before.total + stat.total }
      }
      const next: Progress = {
        version: 2,
        best: current.best && ratio(current.best) >= ratio(score) ? current.best : score,
        last: score,
        tags,
      }
      try {
        storage().setItem(key(trainerId), JSON.stringify(next))
      } catch {
        // сховище недоступне — результат просто не збережеться
      }
      return next
    },
  }
}

/** Сховище сайту: localStorage цього браузера. */
export const localProgressStore = createProgressStore(() => localStorage)
