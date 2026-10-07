import { EXAM } from "./exam"
import { shuffle } from "./order"
import type { Question, RenderedQuestion } from "./question/registry"
import type { RenderedTrainer } from "./schema"

/** Ключ прогресу змішаного тесту — поруч із темами (`trainer:mixed`). */
export const MIXED_ID = "mixed"

/** Практика однієї теми як джерело для змішаного тесту. */
export interface MixedSource {
  /** Slug теми — ключ прогресу й префікс глобального тегу. */
  slug: string
  title: string
  trainer: RenderedTrainer
}

/** Глобальний ключ правила: теги різних тем можуть збігатися (`classify`), тому `<slug>/<tag>`. */
export const globalTag = (slug: string, tag: string) => `${slug}/${tag}`

export function splitGlobalTag(key: string): { slug: string; tag: string } | null {
  const i = key.indexOf("/")
  return i === -1 ? null : { slug: key.slice(0, i), tag: key.slice(i + 1) }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** По одному завданню з кожної теми по колу, доки не набереться `limit`. */
function roundRobin(questions: RenderedQuestion[], limit: number): RenderedQuestion[] {
  const byTopic = new Map<string | undefined, RenderedQuestion[]>()
  for (const q of questions) byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), q])
  const queues = [...byTopic.values()]
  const picked: RenderedQuestion[] = []
  while (picked.length < limit && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift()
      if (next && picked.length < limit) picked.push(next)
    }
  }
  return picked
}

/**
 * Змішаний тест з кількох тем: склад за `EXAM.mixed` (стільки завдань кожного типу, як на НМТ),
 * порівну з усіх тем, випадково; типи поза складом не беруться. Завдання лишає свій `id`
 * (індекс у практиці) і отримує `topic`, тег стає глобальним — так результати за правилами
 * і прогрес не плутають теми. Порядок за рівнями й перемішування — у createSession.
 */
export function composeMixed(
  sources: MixedSource[],
  random: () => number = Math.random,
  limits: Partial<Record<Question["type"], number>> = EXAM.mixed
): RenderedTrainer {
  const pool = sources.flatMap((source) =>
    source.trainer.questions.map((question) => ({
      ...question,
      tag: globalTag(source.slug, question.tag),
      topic: source.slug,
    }))
  )
  const questions = Object.entries(limits).flatMap(([type, limit]) =>
    roundRobin(
      shuffle(
        pool.filter((q) => q.type === type),
        random
      ),
      limit
    )
  )

  const used = new Set(questions.map((q) => q.tag))
  const tags: RenderedTrainer["tags"] = {}
  for (const source of sources) {
    for (const [tag, label] of Object.entries(source.trainer.tags)) {
      const key = globalTag(source.slug, tag)
      if (used.has(key)) tags[key] = `${escapeHtml(source.title)}: ${label}`
    }
  }
  return { tags, questions }
}
