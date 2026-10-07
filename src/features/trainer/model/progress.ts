import type { TagStat } from "./session"

/**
 * Збережений прогрес тренажера. Сховище — за інтерфейсом `ProgressStore`:
 * зараз це localStorage браузера, у тестах — пам'ять; формат має `version`,
 * щоб старі записи читалися після зміни формату (див. `migrate`).
 */
export interface Score {
  score: number
  total: number
}

/** Результат повного проходу тренажера. */
export interface TrainerResult extends Score {
  /** Правильно/усього за кожним правилом теми за цей прохід. */
  tags: Record<string, TagStat>
}

/** Один повний прохід з часом (мс від епохи). */
interface Attempt extends TrainerResult {
  at: number
}

export interface Progress {
  version: 3
  best?: Score
  last?: Score
  /** Останні проходи, найновіший — останній; не більше `ATTEMPTS_KEPT`. */
  attempts: Attempt[]
  /** Накопичено за всі проходи: правильно/усього за кожним правилом теми. */
  tags: Record<string, TagStat>
}

export interface ProgressStore {
  load(trainerId: string): Progress
  /** Записує повний прохід і повертає оновлений прогрес. */
  save(trainerId: string, result: TrainerResult): Progress
}

/** Скільки останніх проходів зберігати — вистачає для сторінки прогресу, не роздуває сховище. */
export const ATTEMPTS_KEPT = 20

export const EMPTY_PROGRESS: Progress = { version: 3, attempts: [], tags: {} }

/** Ключ результатів тренажера: `trainer:<slug теми>` — не залежить від адреси сторінки. */
const key = (trainerId: string) => `trainer:${trainerId}`
/** Ключ до переїзду сторінок (content/practice/<slug>): читається, якщо за новим ще нічого немає. */
const legacyKey = (trainerId: string) => `trainer:practice/${trainerId}`

/** Версія 1 (без поля `version`): лише best і last. Версія 2: ще `tags`, без історії проходів. */
type Stored = Partial<Progress> & { version?: 2 | 3 }

/** Запис будь-якої версії → поточний формат. Зіпсований запис — як порожній. */
function migrate(raw: unknown): Progress {
  if (!raw || typeof raw !== "object") return EMPTY_PROGRESS
  const stored = raw as Stored
  return {
    ...EMPTY_PROGRESS,
    best: stored.best,
    last: stored.last,
    tags: stored.tags ?? {},
    attempts: stored.version === 3 && Array.isArray(stored.attempts) ? stored.attempts : [],
  }
}

const ratio = ({ score, total }: Score) => score / total

/** Мінімум, що потрібен від сховища: Storage браузера або будь-який його замінник. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem">

/**
 * `storage` — функція, бо localStorage береться лише в момент виклику: на сервері його немає,
 * а в приватному режимі сам доступ може кинути помилку — тоді просто нічого не зберігаємо.
 * `now` — час проходу; у тестах підставний.
 */
export function createProgressStore(
  storage: () => KeyValueStorage,
  now: () => number = Date.now
): ProgressStore {
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
        version: 3,
        best: current.best && ratio(current.best) >= ratio(score) ? current.best : score,
        last: score,
        attempts: [...current.attempts, { ...result, at: now() }].slice(-ATTEMPTS_KEPT),
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
