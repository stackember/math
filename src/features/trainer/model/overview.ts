import { MIXED_ID, splitGlobalTag } from "./mixed"
import type { Progress } from "./progress"
import type { TagStat } from "./session"

/** Тема з практикою — що про неї знає сторінка прогресу (дані з контенту, без сховища). */
export interface TopicInfo {
  /** Slug теми — ключ прогресу. */
  id: string
  title: string
  /** Адреса практики. */
  url: string
  /** id правила → назва (HTML). */
  tags: Record<string, string>
  /** Скільки завдань у практиці. */
  total: number
}

interface RuleStat extends TagStat {
  tag: string
  /** Назва правила (HTML). */
  label: string
}

export interface TopicOverview extends TopicInfo {
  progress: Progress
  /** Правила теми: накопичено з практики і зі змішаного тесту. */
  rules: RuleStat[]
}

interface WeakRule extends RuleStat {
  topic: TopicInfo
}

export interface Overview {
  topics: TopicOverview[]
  mixed: Progress
  /** Правила, де частка правильних найнижча (є хоч `MIN_TOTAL` відповідей). */
  weak: WeakRule[]
  /** Скільки тем уже проходили. */
  started: number
  /** Усього повних проходів практик. */
  attempts: number
}

/** Правило вважається слабким, якщо з `MIN_TOTAL` відповідей правильних менше за `WEAK_SHARE`. */
const MIN_TOTAL = 2
const WEAK_SHARE = 0.75
const WEAK_LIMIT = 5

const add = (a: TagStat, b: TagStat): TagStat => ({
  correct: a.correct + b.correct,
  total: a.total + b.total,
})

/** Зведення прогресу за всіма темами: читає сховище один раз на тему й для змішаного тесту. */
export function overview(topics: TopicInfo[], load: (id: string) => Progress): Overview {
  const mixed = load(MIXED_ID)

  const fromMixed = new Map<string, Map<string, TagStat>>()
  for (const [key, stat] of Object.entries(mixed.tags)) {
    const parts = splitGlobalTag(key)
    if (!parts) continue
    const byTag = fromMixed.get(parts.slug) ?? new Map<string, TagStat>()
    byTag.set(parts.tag, stat)
    fromMixed.set(parts.slug, byTag)
  }

  const overviews = topics.map((topic): TopicOverview => {
    const progress = load(topic.id)
    const rules = Object.entries(topic.tags).map(([tag, label]) => ({
      tag,
      label,
      ...add(
        progress.tags[tag] ?? { correct: 0, total: 0 },
        fromMixed.get(topic.id)?.get(tag) ?? { correct: 0, total: 0 }
      ),
    }))
    return { ...topic, progress, rules }
  })

  const weak = overviews
    .flatMap((topic) => topic.rules.map((rule) => ({ ...rule, topic })))
    .filter((rule) => rule.total >= MIN_TOTAL && rule.correct / rule.total < WEAK_SHARE)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .slice(0, WEAK_LIMIT)

  return {
    topics: overviews,
    mixed,
    weak,
    started: overviews.filter((t) => t.progress.last).length,
    attempts: overviews.reduce((sum, t) => sum + t.progress.attempts.length, 0),
  }
}
