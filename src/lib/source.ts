import { loader, type InferPageType } from "fumadocs-core/source"
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons"
import { metaSchema, pageSchema } from "fumadocs-core/source/schema"
import { defineDocs } from "fumadocs-mdx/macro"

import { quizSchema } from "@/lib/quiz/schema"
import { topicsPlugin } from "@/lib/topics"

/**
 * Контент сайту з папки content/. Frontmatter перевіряється схемою під час збирання:
 * `quiz` — лише на сторінках практики (див. src/lib/quiz/schema.ts).
 * Глобальні MDX-плагіни (формули) — у source.config.ts.
 */
const content = defineDocs({
  dir: "content",
  docs: {
    schema: pageSchema.extend({ quiz: quizSchema.optional() }),
  },
  meta: {
    schema: metaSchema,
  },
})

export const source = loader({
  baseUrl: "/",
  source: content.toFumadocsSource(),
  plugins: [lucideIconsPlugin(), topicsPlugin()],
})

export type ContentPage = InferPageType<typeof source>
