import type { Markdown } from "@/shared/lib/markdown"

import { moduleOf, type Question, type RenderedQuestion } from "./question/registry"
import type { RenderedTrainer, TrainerData } from "./schema"

interface Asset {
  mime: string
  base64: string
}

export interface RenderOptions {
  md: Markdown
  /** Читає файл рисунка за шляхом з frontmatter (відносно папки теми). Лише під час збирання. */
  readAsset(src: string): Promise<Asset>
}

const escapeAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")

/** Рисунок вбудовується в HTML даними: сторінка самодостатня, окрема папка public/ не потрібна. */
async function figureHtml(
  figure: { src: string; alt: string },
  readAsset: RenderOptions["readAsset"]
) {
  const { mime, base64 } = await readAsset(figure.src)
  return `<img src="data:${mime};base64,${base64}" alt="${escapeAttr(figure.alt)}" class="mx-auto max-h-72">`
}

async function renderQuestion(
  question: Question,
  id: number,
  { md, readAsset }: RenderOptions
): Promise<RenderedQuestion> {
  const own = await moduleOf(question).render(question, md)
  return {
    ...own,
    id,
    q: await md.block(question.q),
    why: await md.block(question.why),
    ...(question.figure ? { figureHtml: await figureHtml(question.figure, readAsset) } : {}),
  }
}

/**
 * Рендер під час збирання (викликається зі схеми frontmatter у src/features/content/model/frontmatter.ts):
 * у браузер іде готовий HTML, KaTeX там не потрібен. Лише для збирання — клієнтський код це не імпортує.
 */
export async function renderTrainer(
  trainer: TrainerData,
  options: RenderOptions
): Promise<RenderedTrainer> {
  const tags = await Promise.all(
    Object.entries(trainer.tags).map(
      async ([id, label]) => [id, await options.md.inline(label)] as const
    )
  )
  return {
    tags: Object.fromEntries(tags),
    questions: await Promise.all(trainer.questions.map((q, i) => renderQuestion(q, i, options))),
  }
}
