// @ts-check
import { unified as remarkProcessor } from "@astrojs/markdown-remark"
import react from "@astrojs/react"
import starlight from "@astrojs/starlight"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import rehypeKatex from "rehype-katex"
import remarkMath from "remark-math"

import { katexOptions } from "./src/lib/math.ts"

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "Математика · НМТ",
      defaultLocale: "root",
      locales: { root: { label: "Українська", lang: "uk" } },
      // Меню будується з папок; порядок тем — sidebar.order у frontmatter.
      sidebar: [
        { label: "🏠 Як вчитися", link: "/" },
        { label: "📖 Теорія", items: [{ autogenerate: { directory: "theory" } }] },
        { label: "🏋️ Практика", items: [{ autogenerate: { directory: "practice" } }] },
      ],
      customCss: ["katex/dist/katex.min.css", "./src/styles/global.css"],
      components: {
        PageTitle: "./src/components/overrides/PageTitle.astro",
        TwoColumnContent: "./src/components/overrides/TwoColumnContent.astro",
      },
    }),
    react(),
  ],
  markdown: {
    // Офіційний remark/rehype-процесор: зрілі remark-math + rehype-katex.
    // Типовий для Astro 7 Sätteri має KaTeX лише через сторонній плагін.
    processor: remarkProcessor({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, katexOptions]],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
