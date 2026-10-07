import { flattenTree } from "fumadocs-core/page-tree"

import type { RenderedTrainer } from "@/features/trainer/model/schema"

import { source } from "./source"
import { isPractice, theorySlugs, topicOf } from "./topic"

/** Практика теми як дані для змішаного тесту й сторінки прогресу. */
export interface PracticeSource {
  /** Slug теми — ключ прогресу. */
  slug: string
  /** Назва теми (з теорії), без «Практика: ». */
  title: string
  /** Адреса практики. */
  url: string
  trainer: RenderedTrainer
}

/** Усі практики в порядку меню (дерево сторінок), з назвами тем. */
export function practiceSources(): PracticeSource[] {
  const order = flattenTree(source.getPageTree().children).map((item) => item.url)
  return source
    .getPages()
    .filter((page) => isPractice(page.slugs) && page.data.trainer)
    .sort((a, b) => order.indexOf(a.url) - order.indexOf(b.url))
    .flatMap((page) => {
      const topic = topicOf(page.slugs)
      const trainer = page.data.trainer
      if (!topic || !trainer) return []
      const theory = source.getPage(theorySlugs(topic))
      return [
        {
          slug: topic.slug,
          title: theory?.data.title ?? page.data.title,
          url: page.url,
          trainer,
        },
      ]
    })
}
