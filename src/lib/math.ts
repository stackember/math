import type { Options } from "rehype-katex"

/**
 * Спільні налаштування KaTeX: для сторінок (astro.config) і для тренажерів (quiz/render).
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
