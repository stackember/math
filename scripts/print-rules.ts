/**
 * Друкує склад тренажера профілю іспиту і типи завдань (реєстр, `meta` модулів) —
 * для skill /practice, щоб довідка не копіювала числа й приклади руками.
 *   npm run rules            — профіль за замовчуванням
 *   npm run rules -- math    — профіль предмета
 */
import { subjectOf } from "@/features/content/model/subject"
import type { ExamProfile, Range } from "@/features/trainer/model/exam/profile"
import { DEFAULT_PROFILE, profileOf } from "@/features/trainer/model/exam/registry"
import { QUESTION_MODULES } from "@/features/trainer/model/question/registry"

const range = ([min, max]: Range) => `${min}–${max}`

function print(profile: ExamProfile) {
  const { composition, levels, letters } = profile
  const rows = [
    ["Усього", range(composition.total)],
    [`★ ${levels[1].label} — пряме застосування одного правила`, range(composition.levels[1])],
    [`★★ ${levels[2].label} — 1–2 кроки, як у реальному тесті`, range(composition.levels[2])],
    [`★★★ ${levels[3].label} — з розділу «Пастки» теорії`, range(composition.levels[3])],
    ...QUESTION_MODULES.map((m) => {
      const limit = composition.types[m.type]
      return [`\`${m.type}\` (${m.meta.label})`, limit ? range(limit) : "решта"]
    }),
  ]
  const params: Record<string, string> = {
    choice: `${letters.length} варіантів ${letters[0]}–${letters.at(-1)}`,
    match: `${profile.match.left} пунктів ↔ ${profile.match.right} варіантів`,
    multi: `варіантів ${range(profile.multi.options)}, правильних ${range(profile.multi.correct)}`,
    short: `до ${profile.short.fields} полів`,
  }

  console.log(`Профіль іспиту: **${profile.name}** (\`${profile.id}\`)\n`)
  console.log(`| | Кількість |\n|---|---|\n${rows.map(([a, b]) => `| ${a} | ${b} |`).join("\n")}`)
  console.log(
    `\n### Типи завдань\n\n| \`type\` | Що це | Як відповідати | У цьому профілі |\n|---|---|---|---|`
  )
  for (const m of QUESTION_MODULES) {
    console.log(
      `| \`${m.type}\` | ${m.meta.label} | ${m.meta.answerHint} | ${params[m.type] ?? "—"} |`
    )
  }
  console.log(
    `\n### Приклад кожного типу (YAML у \`trainer.questions\`)\n\n\`\`\`yaml\n${QUESTION_MODULES.map((m) => m.meta.example).join("\n\n")}\n\`\`\``
  )
}

const slug = process.argv[2]
const subject = slug ? subjectOf(slug) : undefined
if (slug && !subject) {
  console.error(`Невідомий предмет «${slug}»`)
  process.exit(1)
}
print(subject ? profileOf(subject.exam) : DEFAULT_PROFILE)
