import { loader } from "fumadocs-core/source"
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons"
import { metaSchema } from "fumadocs-core/source/schema"
import { defineDocs } from "fumadocs-mdx/macro"
import { z } from "zod"

import { examProfileIdSchema } from "@/features/trainer/model/exam/registry"

import { frontmatterSchema } from "./frontmatter"
import { pageTreePlugin } from "./page-tree"

/**
 * Контент сайту з папки content/. Frontmatter перевіряється під час збирання схемою,
 * що залежить від файлу (./frontmatter.ts): practice.mdx — з тренажером за профілем предмета, решта — без.
 * meta.json предмета (`root: true`) несе ще `exam` — профіль іспиту з реєстру.
 * Глобальні MDX-плагіни (формули) — у source.config.ts.
 */
const content = defineDocs({
  // лише літерал: макрос fumadocs-mdx читає його під час збирання; те саме значення — CONTENT_DIR у topic.ts
  dir: "content",
  docs: {
    schema: frontmatterSchema,
  },
  meta: {
    schema: metaSchema.extend({
      exam: examProfileIdSchema.optional(),
      description: z.string().optional(),
    }),
  },
})

export const source = loader({
  baseUrl: "/",
  source: content.toFumadocsSource(),
  plugins: [lucideIconsPlugin(), pageTreePlugin()],
})
