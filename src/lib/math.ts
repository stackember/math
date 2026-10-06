import type { Options } from "rehype-katex"
import type { Plugin } from "unified"

/**
 * Спільні налаштування KaTeX: для сторінок (source.config.ts) і для тренажерів (quiz/render).
 * Множини пишемо жирними, як прийнято на НМТ: $\N$, $\Z$, $\Q$, $\I$, $\R$.
 */
export const katexOptions: Options = {
  macros: {
    "\\N": "\\mathbf{N}",
    "\\Z": "\\mathbf{Z}",
    "\\Q": "\\mathbf{Q}",
    "\\I": "\\mathbf{I}",
    "\\R": "\\mathbf{R}",
  },
}

/**
 * rehype-katex на зламаній формулі не зупиняє збирання — лише малює на сторінці червоний текст.
 * Цей плагін (ставити одразу після rehype-katex) робить із цього помилку збирання з місцем у файлі.
 */
export const rehypeKatexStrict: Plugin<[]> = () => (_tree, file) => {
  const problem = file.messages.find((message) => message.source === "rehype-katex")
  if (!problem) return
  const detail = problem.cause instanceof Error ? problem.cause.message : problem.reason
  file.fail(`Помилка у формулі: ${detail}`, { place: problem.place, source: "katex" })
}
