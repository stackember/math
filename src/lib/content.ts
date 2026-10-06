import { getCollection, type CollectionEntry } from "astro:content"

/**
 * Угоди про шляхи сторінок (id у колекції `docs`):
 *   topics/<book>/<NN-topic>                  — конспект за підручником
 *   lessons/<book>/<NN-topic>/<name>          — власний урок
 *   lessons/<book>/<NN-topic>/<name>-trainer  — тренажер до уроку <name>
 */
export type Doc = CollectionEntry<"docs">

export type DocInfo =
  { kind: "topic" | "lesson" | "trainer"; book: string; topic: string } | { kind: "page" }

const TRAINER_SUFFIX = "-trainer"

export function describe(id: string): DocInfo {
  const parts = id.split("/")
  if (parts[0] === "topics" && parts.length === 3) {
    return { kind: "topic", book: parts[1], topic: parts[2] }
  }
  if (parts[0] === "lessons" && parts.length === 4) {
    const kind = parts[3].endsWith(TRAINER_SUFFIX) ? "trainer" : "lesson"
    return { kind, book: parts[1], topic: parts[2] }
  }
  return { kind: "page" }
}

export const href = (id: string) => `/${id}/`
export const topicId = (book: string, topic: string) => `topics/${book}/${topic}`
export const trainerIdOf = (lessonId: string) => `${lessonId}${TRAINER_SUFFIX}`
export const lessonIdOf = (trainerId: string) => trainerId.slice(0, -TRAINER_SUFFIX.length)

/** Назва як у меню. */
export const menuLabel = (doc: Doc) => doc.data.sidebar?.label ?? doc.data.title

export interface LessonWithTrainer {
  lesson: Doc
  trainer?: Doc
}

/** Уроки теми в порядку меню, кожен — зі своїм тренажером, якщо він є. */
export async function topicLessons(book: string, topic: string): Promise<LessonWithTrainer[]> {
  const prefix = `lessons/${book}/${topic}/`
  const docs = await getCollection("docs", (doc) => doc.id.startsWith(prefix))
  const trainers = new Map(
    docs
      .filter((doc) => describe(doc.id).kind === "trainer")
      .map((doc) => [lessonIdOf(doc.id), doc])
  )
  const order = (doc: Doc) => doc.data.sidebar?.order ?? Number.MAX_SAFE_INTEGER
  return docs
    .filter((doc) => describe(doc.id).kind === "lesson")
    .sort((a, b) => order(a) - order(b) || a.id.localeCompare(b.id))
    .map((lesson) => ({ lesson, trainer: trainers.get(lesson.id) }))
}
