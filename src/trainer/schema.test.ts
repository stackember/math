import { describe, expect, it } from "vitest"

import { quizSchema } from "./schema"

const choice = (n: number, level: 1 | 2 | 3, extra = {}) => ({
  type: "choice",
  level,
  tag: "a",
  q: `Питання ${n}`,
  options: ["1", "2", "3", "4", "5"],
  answer: 0,
  why: "Пояснення",
  ...extra,
})

/** Мінімальний валідний тренажер: 12 завдань, склад за правилами. */
function validQuiz() {
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
  const result = quizSchema.safeParse(data)
  return result.success ? [] : result.error.issues.map((i) => i.message)
}

describe("quizSchema", () => {
  it("приймає тренажер за правилами", () => {
    expect(messages(validQuiz())).toEqual([])
  })

  it("ловить тег без опису й непокритий тег", () => {
    const quiz = validQuiz()
    quiz.questions[0].tag = "unknown"
    quiz.tags = { ...quiz.tags, c: "Правило В" } as typeof quiz.tags
    const result = messages(quiz)
    expect(result).toContain("завдання 1: тег «unknown» не описаний у tags")
    expect(result).toContain("тег «c» не покритий жодним завданням")
  })

  it("ловить варіанти, що залежать від порядку", () => {
    const quiz = validQuiz()
    quiz.questions[0] = choice(1, 1, { options: ["1", "2", "3", "4", "усі перелічені"] })
    expect(messages(quiz)).toContain(
      "завдання 1: «усі перелічені» залежить від порядку, а варіанти перемішуються"
    )
  })

  it("ловить порушення складу", () => {
    const quiz = validQuiz()
    quiz.questions = quiz.questions.filter((q) => q.type !== "match")
    expect(messages(quiz)).toContain("тип match: потрібно 1–2, зараз 0")
  })

  it("вимагає 5 варіантів і різні відповіді у відповідності", () => {
    const quiz = validQuiz()
    quiz.questions[0] = choice(1, 1, { options: ["1", "2", "3", "4"] })
    ;(quiz.questions[7] as { answer: number[] }).answer = [0, 0, 1]
    const result = messages(quiz)
    expect(result.some((m) => m.includes("5"))).toBe(true)
    expect(result).toContain("завдання 8: відповіді у відповідності мають бути різними")
  })
})
