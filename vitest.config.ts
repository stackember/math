import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": local("./src"),
      // серверні модулі тестуються напряму в Node — справжній `server-only` там кидає помилку
      "server-only": local("./src/test/server-only.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
})
