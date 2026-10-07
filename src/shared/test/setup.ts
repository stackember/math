import { afterEach } from "vitest"

/**
 * Спільне налаштування Vitest. Тести hooks і компонентів позначені `// @vitest-environment jsdom`;
 * після кожного такого тесту прибираємо змонтоване (RTL без `globals` цього сам не робить).
 */
if (typeof document !== "undefined") {
  const { cleanup } = await import("@testing-library/react")
  afterEach(cleanup)
}
