import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import boundaries from "eslint-plugin-boundaries"
import checkFile from "eslint-plugin-check-file"
import { defineConfig, globalIgnores } from "eslint/config"

/**
 * Межі архітектури (див. AGENTS.md → «Розбивка коду»). Елементи:
 *   app         src/app — маршрути Next
 *   ui          src/shared/ui — shadcn
 *   lib         src/shared/lib — утиліти без домену
 *   test        src/shared/test — налаштування Vitest
 *   model       src/features/<можливість>/model — чиста логіка без React
 *   hooks       src/features/<можливість>/hooks — React-hooks без розмітки
 *   components  src/features/<можливість>/components — розмітка
 * `feature` — назва можливості: content, trainer, diagram.
 * Файл категорії `build` (model/render.ts) існує лише для збирання: його імпортує тільки схема frontmatter.
 * Напрямок залежностей: app → фічі → ui, lib; усередині фічі components → hooks → model.
 */
const segment = (type) => ({
  type,
  pattern: [`src/features/*/${type}`],
  capture: ["feature"],
})

const element = (type, captured) => ({ element: captured ? { type, captured } : { type } })
const sameFeature = { feature: "{{ from.element.captured.feature }}" }
const external = (source) => ({ module: { origin: "external", source } })
const buildFiles = { file: { categories: "build" } }
const FRAMEWORK = [
  "next",
  "next/*",
  "fumadocs-core",
  "fumadocs-core/*",
  "fumadocs-ui",
  "fumadocs-ui/*",
  "fumadocs-mdx",
  "fumadocs-mdx/*",
]

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
    "src/shared/ui/**",
  ]),
  {
    files: ["src/**/*.{ts,tsx}", "e2e/**/*.ts", "*.{ts,mjs}"],
    plugins: { "check-file": checkFile },
    rules: {
      // файли kebab-case; компонент експортується PascalCase (trainer-card.tsx → TrainerCard)
      "check-file/filename-naming-convention": [
        "error",
        { "**/*.{ts,tsx,mjs}": "KEBAB_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": ["error", { "src/**/": "NEXT_JS_APP_ROUTER_CASE" }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}", "scripts/**/*.{ts,mjs}", "e2e/**/*.ts"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        { type: "ui", pattern: "src/shared/ui" },
        { type: "lib", pattern: "src/shared/lib" },
        { type: "test", pattern: "src/shared/test" },
        { type: "scripts", pattern: "scripts" },
        { type: "e2e", pattern: "e2e" },
        segment("model"),
        segment("hooks"),
        segment("components"),
      ],
      "boundaries/files": [
        { pattern: "src/features/*/model/render.ts", category: "build" },
        // угода про шлях теми — чиста функція, її виконують і e2e
        { pattern: "src/features/content/model/topic.ts", category: "convention" },
      ],
      "boundaries/ignore": ["**/*.test.ts"],
    },
    rules: {
      // кожен файл у src/ належить до елемента; імпорт файлу поза схемою — помилка
      "boundaries/no-unknown-files": "error",
      "boundaries/no-unknown-dependencies": "error",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          checkAllOrigins: true,
          // останнє правило, що збіглося, перемагає
          policies: [
            // зовнішні пакети дозволені всім, крім винятків нижче
            { from: element("*"), allow: { to: { module: { origin: "external" } } } },
            // модулі Node (node:fs, node:path) — лише content/model: читає рисунки завдань під час збирання
            {
              from: element("model", { feature: "content" }),
              allow: { to: { module: { origin: "core" } } },
            },
            // model — без React, Next і DOM-бібліотек
            {
              from: element("model"),
              disallow: { to: external(["react", "react-dom", "next", "next/*"]) },
            },
            // фреймворк знають лише app і content (lib — лише типи Fumadocs, для підписів i18n)
            {
              from: element(["components", "hooks", "model"], { feature: "!content" }),
              disallow: { to: external(FRAMEWORK) },
            },
            {
              from: element("lib"),
              disallow: { to: external(FRAMEWORK), dependency: { kind: "value" } },
            },

            { from: element("app"), allow: { to: element(["components", "model", "ui", "lib"]) } },
            { from: element("ui"), allow: { to: element(["ui", "lib"]) } },
            { from: element("lib"), allow: { to: element("lib") } },
            { from: element("test"), allow: { to: element("*") } },
            // scripts (перевірка контенту, hooks) — лише чиста логіка model і lib, без React і Next
            { from: element("scripts"), allow: { to: element(["model", "lib", "scripts"]) } },
            { from: element("scripts"), allow: { to: { module: { origin: "core" } } } },
            // e2e — самодостатні: з src лише типи (контракт завдань), код сайту не виконують
            { from: element("e2e"), allow: { to: element("e2e") } },
            { from: element("e2e"), allow: { to: { module: { origin: "core" } } } },
            { from: element("e2e"), allow: { to: element("model"), dependency: { kind: "type" } } },
            { from: element("e2e"), allow: { to: { file: { categories: "convention" } } } },

            {
              from: element("components"),
              allow: { to: element(["components", "hooks", "model"], sameFeature) },
            },
            { from: element("components"), allow: { to: element(["ui", "lib"]) } },
            // content збирає сторінку з усіх можливостей: реєстр MDX-компонентів знає схеми
            {
              from: element("components", { feature: "content" }),
              allow: { to: element("components") },
            },

            { from: element("hooks"), allow: { to: element(["hooks", "model"], sameFeature) } },
            { from: element("hooks"), allow: { to: element("lib") } },

            { from: element("model"), allow: { to: element(["model"], sameFeature) } },
            { from: element("model"), allow: { to: element("lib") } },
            // схема frontmatter перевіряє тренажер і рендерить його під час збирання
            {
              from: element("model", { feature: "content" }),
              allow: { to: element("model", { feature: "trainer" }) },
            },

            // model/render.ts — лише для збирання: імпортує його тільки схема frontmatter
            { from: element("*"), disallow: { to: buildFiles } },
            { from: element("model", { feature: "content" }), allow: { to: buildFiles } },
          ],
        },
      ],
    },
  },
])
