import { renderQuiz } from "@/lib/quiz/render"
import { storageKey } from "@/lib/quiz/storage"
import type { ContentPage } from "@/lib/source"
import { topicOf } from "@/lib/topics"

import { QuizLoader } from "./QuizLoader"

/**
 * Тренажер сторінки практики: бере `quiz` з frontmatter, рендерить формули на сервері
 * (під час збирання) і віддає готові дані клієнтському компоненту.
 * У MDX вставляється як `<Trainer />` — сторінку підставляє [[...slug]]/page.tsx.
 */
export async function Trainer({ page }: { page: ContentPage }) {
  if (topicOf(page.slugs)?.section !== "practice") {
    throw new Error(
      `«${page.path}»: <Trainer /> можна вставляти лише на сторінки content/practice/`
    )
  }
  if (!page.data.quiz) {
    throw new Error(`«${page.path}»: немає поля quiz у frontmatter`)
  }

  const quiz = await renderQuiz(page.data.quiz)

  return (
    <div className="not-prose mt-8">
      <QuizLoader quiz={quiz} storageKey={storageKey(page.slugs.join("/"))} />
    </div>
  )
}
