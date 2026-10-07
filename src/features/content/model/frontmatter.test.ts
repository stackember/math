import { describe, expect, it } from "vitest"

import { frontmatterSchema } from "./frontmatter"

const page = { title: "Модуль числа", description: "Опис" }

/** Мінімальний тренажер за правилами складу (12 завдань). */
const trainer = {
  tags: { a: "Правило А", b: "Правило Б $x^2$" },
  questions: [
    ...[1, 1, 1, 2, 2, 2].map((level, i) => ({
      type: "choice",
      level,
      tag: "a",
      q: `Умова ${i}`,
      options: ["1", "2", "3", "4", "5"],
      answer: 0,
      why: "Пояснення",
    })),
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
    { type: "short", level: 2, tag: "a", q: "Коротка 1 $\\frac12$", answer: 4, why: "Пояснення" },
    { type: "short", level: 3, tag: "b", q: "Коротка 2", answer: -2.5, why: "Пояснення" },
    { type: "choice", level: 3, tag: "b", q: "Пастка", options: ["1", "2", "3", "4", "5"], answer: 1, why: "Пояснення" },
  ],
}

const validate = (path: string, data: unknown) => frontmatterSchema({ path })["~standard"].validate(data)

describe("frontmatterSchema", () => {
  it("теорія без тренажера проходить", async () => {
    const result = await validate("content/numbers/modulus/index.mdx", page)
    expect(result.issues).toBeUndefined()
  })

  it("тренажер у теорії — помилка українською", async () => {
    const result = await validate("content/numbers/modulus/index.mdx", { ...page, trainer })
    expect(result.issues?.map((i) => i.message)).toEqual([
      "блок trainer можна описувати лише у файлі practice.mdx",
    ])
  })

  it("практика без тренажера — помилка українською", async () => {
    const result = await validate("content/numbers/modulus/practice.mdx", page)
    expect(result.issues?.map((i) => i.message)).toEqual([
      "немає блоку trainer: у practice.mdx тренажер обов'язковий",
    ])
  })

  it("практика з тренажером: формули відрендерено в HTML під час перевірки", async () => {
    const result = await validate("content/numbers/modulus/practice.mdx", { ...page, trainer })
    expect(result.issues).toBeUndefined()
    const value = (result as { value: { trainer: { tags: Record<string, string>; questions: { q: string; id: number }[] } } }).value
    expect(value.trainer.tags.b).toContain('class="katex"')
    expect(value.trainer.questions[7].q).toContain('class="katex"')
    expect(value.trainer.questions.map((q) => q.id)).toEqual([...Array(10).keys()])
  })
})
