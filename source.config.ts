import { defineConfig } from "fumadocs-mdx/config"
import rehypeKatex from "rehype-katex"
import remarkMath from "remark-math"

import { latexToText } from "./src/lib/latex-text"
import { katexOptions } from "./src/lib/math"

/**
 * Глобальні налаштування MDX: формули KaTeX поверх стандартного набору плагінів Fumadocs.
 * Колекції (що і звідки читати, схема frontmatter) — у src/lib/source.ts.
 */
export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMath],
    // KaTeX — першим, до підсвітки коду (рекомендація Fumadocs)
    rehypePlugins: (plugins) => [[rehypeKatex, katexOptions], ...plugins],
    // у пошуку формули — читабельним текстом («5 · (−4)»), а не сирим LaTeX
    remarkStructureOptions: {
      stringify: {
        handlers: {
          inlineMath: (node: { value: string }) => latexToText(node.value),
          math: (node: { value: string }) => latexToText(node.value),
        },
      },
    },
  },
})
