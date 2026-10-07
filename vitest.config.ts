import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  resolve: {
    alias: { "@": local("./src") },
  },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    // model-тести йдуть у Node; hooks і компоненти вмикають jsdom рядком `// @vitest-environment jsdom`
    setupFiles: ["src/shared/test/setup.ts"],
  },
})
