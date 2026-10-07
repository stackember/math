import type { ExamProfile } from "./exam/profile"
import { shuffle } from "./order"
import type { RenderedQuestion } from "./question/registry"
import type { RenderedTrainer } from "./schema"

/** Ключ прогресу змішаного тесту — за профілем іспиту, бо тест збирається з усіх предметів профілю. */
export const mixedId = (profileId: string) => `mixed/${profileId}`

/** Практика однієї теми як джерело для змішаного тесту. */
export interface MixedSource {
  /** Id теми `<предмет>/<slug>` — ключ прогресу й префікс глобального тегу. */
  id: string
  title: string
  trainer: RenderedTrainer
}

/** Глобальний ключ правила: теги різних тем можуть збігатися (`classify`), тому `<id теми>/<tag>`. */
export const globalTag = (topicId: string, tag: string) => `${topicId}/${tag}`

export function splitGlobalTag(key: string): { topicId: string; tag: string } | null {
  const i = key.lastIndexOf("/")
  return i === -1 ? null : { topicId: key.slice(0, i), tag: key.slice(i + 1) }
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
 * Змішаний тест: склад за `profile.mixed` (стільки завдань кожного типу, як на іспиті),
 * порівну з усіх тем, випадково; типи поза складом не беруться. Завдання лишає свій `index`
 * (номер у практиці) і отримує `topic`, тег стає глобальним — так результати за правилами
 * і прогрес не плутають теми. Порядок за рівнями й перемішування — у createSession.
 */
export function composeMixed(
  sources: MixedSource[],
  profile: ExamProfile,
  random: () => number = Math.random
): RenderedTrainer {
  const pool = sources.flatMap((source) =>
    source.trainer.questions.map((question) => ({
      ...question,
      tag: globalTag(source.id, question.tag),
      topic: source.id,
    }))
  )
  const questions = Object.entries(profile.mixed).flatMap(([type, limit]) =>
    limit
      ? roundRobin(
          shuffle(
            pool.filter((q) => q.type === type),
            random
          ),
          limit
        )
      : []
  )

  const used = new Set(questions.map((q) => q.tag))
  const tags: RenderedTrainer["tags"] = {}
  for (const source of sources) {
    for (const [tag, label] of Object.entries(source.trainer.tags)) {
      const key = globalTag(source.id, tag)
      if (used.has(key)) tags[key] = `${escapeHtml(source.title)}: ${label}`
    }
  }
  return { exam: profile.id, tags, questions }
}
