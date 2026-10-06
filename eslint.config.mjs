import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".source/**",
    "out/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    // shadcn — генерований код, оновлюється через `npx shadcn@latest add`
    "src/components/ui/**",
  ]),
])
