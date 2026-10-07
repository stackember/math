import { loader, type InferPageType } from "fumadocs-core/source"
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons"
import { metaSchema } from "fumadocs-core/source/schema"
import { defineDocs } from "fumadocs-mdx/macro"

import { frontmatterSchema } from "./frontmatter"
import { pageTreePlugin } from "./page-tree"

/**
 * Контент сайту з папки content/. Frontmatter перевіряється під час збирання схемою,
 * що залежить від файлу (./frontmatter.ts): practice.mdx — з тренажером, решта — без.
 * Глобальні MDX-плагіни (формули) — у source.config.ts.
 */
const content = defineDocs({
  dir: "content",
  docs: {
    schema: frontmatterSchema,
  },
  meta: {
    schema: metaSchema,
  },
})

export const source = loader({
  baseUrl: "/",
  source: content.toFumadocsSource(),
  plugins: [lucideIconsPlugin(), pageTreePlugin()],
})

export type ContentPage = InferPageType<typeof source>
