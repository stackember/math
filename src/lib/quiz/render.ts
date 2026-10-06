import rehypeKatex from "rehype-katex"
import rehypeStringify from "rehype-stringify"
import remarkMath from "remark-math"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"

import { katexOptions } from "../math"
import type { Question, Quiz } from "./schema"

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex, katexOptions)
  .use(rehypeStringify)

const SINGLE_PARAGRAPH = /^<p>([\s\S]*)<\/p>\n?$/

/** Рядок з Markdown і `$формулами$` → HTML для одного рядка тексту. */
export async function renderInline(markdown: string): Promise<string> {
  const html = String(await processor.process(markdown))
  const match = SINGLE_PARAGRAPH.exec(html)
  if (!match || match[1].includes("<p>")) {
    throw new Error(
      `Очікувався один рядок тексту, а Markdown дав блоки (список, абзаци?): «${markdown}»`
    )
  }
  return match[1]
}

/** Завдання з HTML замість Markdown і зі стабільним `id`. */
export type RenderedQuestion = Question & { id: number }
export type RenderedQuiz = { tags: Quiz["tags"]; questions: RenderedQuestion[] }

const all = (items: string[]) => Promise.all(items.map(renderInline))

async function renderQuestion(question: Question, id: number): Promise<RenderedQuestion> {
  const base = {
    ...question,
    id,
    q: await renderInline(question.q),
    why: await renderInline(question.why),
  }
  switch (question.type) {
    case "choice":
      return {
        ...base,
        type: "choice",
        options: await all(question.options),
        answer: question.answer,
        keepOrder: question.keepOrder,
      }
    case "match":
      return {
        ...base,
        type: "match",
        left: await all(question.left),
        right: await all(question.right),
        answer: question.answer,
      }
    case "short":
      return { ...base, type: "short", answer: question.answer }
  }
}

/** Рендер під час збирання: у браузер іде готовий HTML, KaTeX там не потрібен. */
export async function renderQuiz(quiz: Quiz): Promise<RenderedQuiz> {
  const tags = await Promise.all(
    Object.entries(quiz.tags).map(async ([id, label]) => [id, await renderInline(label)] as const)
  )
  return {
    tags: Object.fromEntries(tags),
    questions: await Promise.all(quiz.questions.map(renderQuestion)),
  }
}
