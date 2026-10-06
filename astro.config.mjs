// @ts-check
import { unified as remarkProcessor } from "@astrojs/markdown-remark"
import react from "@astrojs/react"
import starlight from "@astrojs/starlight"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import rehypeKatex from "rehype-katex"
import remarkMath from "remark-math"

import { katexOptions } from "./src/lib/math.ts"
import { sidebar } from "./src/navigation.ts"

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "Математика · НМТ",
      defaultLocale: "root",
      locales: { root: { label: "Українська", lang: "uk" } },
      sidebar,
      customCss: ["katex/dist/katex.min.css", "./src/styles/global.css"],
      components: {
        PageTitle: "./src/components/overrides/PageTitle.astro",
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
