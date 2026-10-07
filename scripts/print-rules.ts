/**
 * Друкує склад тренажера (профіль іспиту) і типи завдань (реєстр, `meta` модулів) —
 * для skill /practice, щоб довідка не копіювала числа й приклади руками.
 */
import { EXAM } from "@/features/trainer/model/exam"
import { QUESTION_MODULES } from "@/features/trainer/model/question/registry"

const range = ([min, max]: readonly [number, number]) => `${min}–${max}`
const { composition, levels } = EXAM
const limits: Partial<Record<string, readonly [number, number]>> = composition.types

const rows = [
  ["Усього", range(composition.total)],
  [`★ ${levels[1].label} — пряме застосування одного правила`, range(composition.levels[1])],
  [`★★ ${levels[2].label} — 1–2 кроки, як у реальному тесті`, range(composition.levels[2])],
  [`★★★ ${levels[3].label} — з розділу «Пастки» теорії`, range(composition.levels[3])],
  ...QUESTION_MODULES.map((m) => {
    const limit = limits[m.type]
    return [`\`${m.type}\` (${m.meta.label})`, limit ? range(limit) : "решта"]
  }),
]

console.log(`| | Кількість |\n|---|---|\n${rows.map(([a, b]) => `| ${a} | ${b} |`).join("\n")}`)

console.log(`\n### Типи завдань\n\n| \`type\` | Що це | Як відповідати |\n|---|---|---|`)
for (const m of QUESTION_MODULES) {
  console.log(`| \`${m.type}\` | ${m.meta.label} | ${m.meta.answerHint} |`)
}

console.log(
  `\n### Приклад кожного типу (YAML у \`trainer.questions\`)\n\n\`\`\`yaml\n${QUESTION_MODULES.map((m) => m.meta.example).join("\n\n")}\n\`\`\``
)
