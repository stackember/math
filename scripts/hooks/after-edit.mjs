/**
 * Hook Claude Code після Edit/Write (див. .claude/settings.json):
 *   контент (content/**)  → перевірка check-content лише цього файлу; помилки — Claude бачить одразу;
 *   код                   → prettier --write, щоб format:check не падав наприкінці.
 * Читає JSON події зі stdin; код виходу 2 + stderr = повідомлення для Claude.
 */
import { spawnSync } from "node:child_process"
import { relative, resolve } from "node:path"

const input = JSON.parse((await new Response(process.stdin).text().catch(() => "{}")) || "{}")
const file = input.tool_input?.file_path
if (!file) process.exit(0)

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const path = relative(root, resolve(file)).replace(/\\/g, "/")
const run = (cmd, args) =>
  spawnSync(cmd, args, { cwd: root, encoding: "utf8", shell: process.platform === "win32" })

if (path.startsWith("content/")) {
  if (!/\.mdx?$|meta\.json$/.test(path)) process.exit(0)
  const result = run("npx", [
    "tsx",
    "scripts/check-content.ts",
    ...(path.endsWith(".json") ? [] : [path]),
  ])
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout)
    process.exit(2)
  }
} else if (/\.(ts|tsx|mjs|js|json|css|md)$/.test(path) && !path.startsWith("src/shared/ui/")) {
  run("npx", ["prettier", "--write", "--log-level", "warn", path])
}
