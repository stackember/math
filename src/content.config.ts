import { docsLoader } from "@astrojs/starlight/loaders"
import { docsSchema } from "@astrojs/starlight/schema"
import { defineCollection } from "astro:content"
import { z } from "astro/zod"

import { quizSchema } from "./lib/quiz/schema"

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      // `quiz` є лише на сторінках практики (`practice/<slug>.mdx`)
      extend: z.object({ quiz: quizSchema.optional() }),
    }),
  }),
}
