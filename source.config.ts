import { defineConfig } from "fumadocs-mdx/config"

import { latexToText } from "./src/shared/lib/latex-text"
import { mathRehypePlugins, mathRemarkPlugins } from "./src/shared/lib/markdown"

/**
 * Глобальні налаштування MDX: формули KaTeX поверх стандартного набору плагінів Fumadocs.
 * Ті самі плагіни формул рендерять тексти тренажера (src/shared/lib/markdown.ts).
 * Колекції (що і звідки читати, схема frontmatter) — у src/features/content/model/source.ts.
 */
export default defineConfig({
  mdxOptions: {
    remarkPlugins: [...mathRemarkPlugins],
    // KaTeX — першим, до підсвітки коду (рекомендація Fumadocs); зламана формула — помилка збирання
    rehypePlugins: (plugins) => [...mathRehypePlugins, ...plugins],
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
