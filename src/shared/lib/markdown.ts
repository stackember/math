import rehypeKatex from "rehype-katex"
import rehypeStringify from "rehype-stringify"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified, type PluggableList } from "unified"

import { katexOptions, rehypeKatexStrict } from "./math"

/** Плагіни формул — однакові для сторінок MDX (source.config.ts) і текстів тренажера. */
export const mathRemarkPlugins: PluggableList = [remarkMath]
export const mathRehypePlugins: PluggableList = [[rehypeKatex, katexOptions], rehypeKatexStrict]

export interface Markdown {
  /** Рівно один абзац → HTML без `<p>`: варіанти відповіді, назви правил. */
  inline(markdown: string): Promise<string>
  /** Будь-який Markdown (абзаци, `$$…$$`, таблиці, списки) → HTML. */
  block(markdown: string): Promise<string>
}

/**
 * Markdown + формули → HTML. Той самий набір правил, що й на сторінках теорії (GFM, KaTeX),
 * тож усе, що працює в теорії, працює і в завданні. Зламана формула — помилка з текстом.
 */
export function createMarkdown(): Markdown {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(mathRemarkPlugins)
    .use(remarkRehype)
    .use(mathRehypePlugins)
    .use(rehypeStringify)

  const render = async (markdown: string) => {
    try {
      return String(await processor.process(markdown)).trim()
    } catch (error) {
      // зламана формула: додаємо сам текст, щоб його було легко знайти у frontmatter
      throw new Error(
        `${error instanceof Error ? error.message : String(error)} — у тексті «${markdown}»`
      )
    }
  }

  return {
    block: render,
    async inline(markdown) {
      const [first, ...rest] = processor.parse(markdown).children
      if (!first || rest.length > 0 || first.type !== "paragraph") {
        throw new Error(
          `Очікувався один рядок тексту, а Markdown дав блоки (список, абзаци?): «${markdown}»`
        )
      }
      return (await render(markdown)).replace(/^<p>([\s\S]*)<\/p>$/, "$1")
    },
  }
}
