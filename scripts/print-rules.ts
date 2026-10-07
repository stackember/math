/** Друкує склад тренажера з профілю іспиту — для skill /practice (щоб не копіювати числа). */
import { EXAM } from "@/features/trainer/model/exam"

const range = ([min, max]: readonly [number, number]) => `${min}–${max}`
const { composition, levels } = EXAM

console.log(`| | Кількість |
|---|---|
| Усього | ${range(composition.total)} |
| ★ ${levels[1].label} — пряме застосування одного правила | ${range(composition.levels[1])} |
| ★★ ${levels[2].label} — 1–2 кроки, як у реальному тесті | ${range(composition.levels[2])} |
| ★★★ ${levels[3].label} — з розділу «Пастки» теорії | ${range(composition.levels[3])} |
| \`match\` (відповідність ${EXAM.matchLeft}×${EXAM.matchRight}) | ${range(composition.types.match)} |
| \`short\` (коротка відповідь) | ${range(composition.types.short)} |
| \`choice\` (${EXAM.letters.join("–")}, ${EXAM.choiceOptions} варіантів) | решта |`)
