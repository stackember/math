import { describe, expect, it } from "vitest"

import { trainerSchema } from "./schema"

const choice = (n: number, level: 1 | 2 | 3, extra = {}) => ({
  type: "choice",
  level,
  tag: "a",
  q: `Умова ${n}`,
  options: ["1", "2", "3", "4", "5"],
  answer: 0,
  why: "Пояснення",
  ...extra,
})

/** Мінімальний валідний тренажер: 10 завдань, склад за правилами. */
function validTrainer() {
  return {
    tags: { a: "Правило А", b: "Правило Б" },
    questions: [
      choice(1, 1),
      choice(2, 1),
      choice(3, 1),
      choice(4, 2),
      choice(5, 2),
      choice(6, 2),
      choice(7, 3, { tag: "b" }),
      {
        type: "match",
        level: 2,
        tag: "a",
        q: "Відповідність",
        left: ["1", "2", "3"],
        right: ["А", "Б", "В", "Г", "Д"],
        answer: [0, 1, 2],
        why: "Пояснення",
      },
      { type: "short", level: 2, tag: "a", q: "Коротка 1", answer: 4, why: "Пояснення" },
      { type: "short", level: 3, tag: "b", q: "Коротка 2", answer: -2.5, why: "Пояснення" },
    ],
  }
}

const messages = (data: unknown) => {
  const result = trainerSchema.safeParse(data)
  return result.success ? [] : result.error.issues.map((i) => i.message)
}

describe("trainerSchema", () => {
  it("приймає тренажер за правилами", () => {
    expect(messages(validTrainer())).toEqual([])
  })

  it("ловить тег без опису, непокритий тег і поганий id тегу", () => {
    const trainer = validTrainer()
    trainer.questions[0].tag = "unknown"
    trainer.tags = { ...trainer.tags, c: "Правило В", Погано: "x" } as typeof trainer.tags
    const result = messages(trainer)
    expect(result).toContain("завдання 1: тег «unknown» не описаний у tags")
    expect(result).toContain("тег «c» не покритий жодним завданням")
    expect(result).toContain("тег «Погано»: id латиницею в kebab-case")
  })

  it("не плутає успадковані властивості з тегами", () => {
    const trainer = validTrainer()
    trainer.questions[0].tag = "constructor"
    expect(messages(trainer)).toContain("завдання 1: тег «constructor» не описаний у tags")
  })

  it("ловить варіанти, що залежать від порядку", () => {
    const trainer = validTrainer()
    trainer.questions[0] = choice(1, 1, { options: ["1", "2", "3", "4", "усі перелічені"] })
    expect(messages(trainer).some((m) => m.startsWith("завдання 1: «усі перелічені»"))).toBe(true)
  })

  it("ловить порушення складу", () => {
    const trainer = validTrainer()
    trainer.questions = trainer.questions.filter((q) => q.type !== "match")
    expect(messages(trainer)).toContain("тип match: потрібно 1–2, зараз 0")
  })

  it("пояснює форму кожного типу українською", () => {
    const trainer = validTrainer()
    trainer.questions[0] = choice(1, 1, { options: ["1", "2", "3", "4"] })
    ;(trainer.questions[7] as { answer: number[] }).answer = [0, 0, 1]
    Object.assign(trainer.questions[8], { answer: 0.33333 })
    Object.assign(trainer.questions[9], { level: 4 })
    const result = messages(trainer)
    expect(result).toContain("має бути рівно 5 варіантів")
    expect(result).toContain("відповіді у відповідності мають бути різними")
    expect(result).toContain("answer: ціле число або десятковий дріб до 4 знаків після коми")
    expect(result).toContain("level: 1 (легке), 2 (рівень НМТ) або 3 (пастка)")
  })

  it("ловить дублікати у відповідності й незнайомі поля", () => {
    const trainer = validTrainer()
    const match = trainer.questions[7] as { left: string[]; right: string[] }
    match.left = ["1", "1", "3"]
    match.right = ["А", "А", "В", "Г", "Д"]
    trainer.questions[0] = choice(1, 1, { keep_order: true })
    const result = messages(trainer)
    expect(result).toContain("пункти повторюються")
    expect(result).toContain("варіанти повторюються")
    expect(result.some((m) => m.includes("keep_order"))).toBe(true)
  })

  it("без блоку trainer — пояснює, що він обов'язковий", () => {
    expect(messages(undefined)).toEqual([
      "немає блоку trainer: у practice.mdx тренажер обов'язковий",
    ])
  })
})
