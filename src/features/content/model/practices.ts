import { flattenTree } from "fumadocs-core/page-tree"

import type { RenderedTrainer } from "@/features/trainer/model/schema"

import { source } from "./source"
import { subjectOf } from "./subject"
import { isPractice, theorySlugs, topicId, topicOf } from "./topic"

/** Практика теми як дані для змішаного тесту й сторінки прогресу. */
export interface PracticeSource {
  /** Id теми `<предмет>/<slug>` — ключ прогресу. */
  id: string
  subject: string
  /** Назва теми (з теорії), без «Практика: ». */
  title: string
  /** Адреса практики. */
  url: string
  trainer: RenderedTrainer
}

interface Filter {
  subject?: string
  /** Усі предмети цього профілю іспиту — для змішаного тесту «як на іспиті». */
  exam?: string
}

/** Практики в порядку меню, з назвами тем; за потреби — лише предмета або профілю іспиту. */
export function practiceSources({ subject, exam }: Filter = {}): PracticeSource[] {
  const order = flattenTree(source.getPageTree().children).map((item) => item.url)
  return source
    .getPages()
    .filter((page) => isPractice(page.slugs) && page.data.trainer)
    .sort((a, b) => order.indexOf(a.url) - order.indexOf(b.url))
    .flatMap((page) => {
      const topic = topicOf(page.slugs)
      const trainer = page.data.trainer
      if (!topic || !trainer) return []
      if (subject && topic.subject !== subject) return []
      if (exam && subjectOf(topic.subject)?.exam !== exam) return []
      const theory = source.getPage(theorySlugs(topic))
      return [
        {
          id: topicId(topic),
          subject: topic.subject,
          title: theory?.data.title ?? page.data.title,
          url: page.url,
          trainer,
        },
      ]
    })
}
