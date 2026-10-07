import { describe, expect, it } from "vitest"

import { checkMdx, checkStructure } from "./check-content"

const theory = (body: string, fm = "title: Тема\ndescription: Опис") =>
  checkMdx("content/numbers/topic/index.mdx", `---\n${fm}\n---\n\n${body}`)

const messages = async (p: Promise<{ message: string; line?: number }[]>) =>
  (await p).map((x) => `${x.line ?? "-"}: ${x.message}`)

describe("checkMdx: теорія", () => {
  it("правильна теорія проходить", async () => {
    expect(await theory("## Коротко\n\nТекст $x^2$.\n\n## Приклади\n\n## Пастки\n")).toEqual([])
  })

  it("ловить розділ поза форматом, порядок і відсутні розділи", async () => {
    const result = await messages(theory("## Приклади\n\n## Коротко\n\n## Як розв'язувати\n"))
    expect(result).toContainEqual(expect.stringMatching(/^8: розділ «Коротко» не на своєму місці/))
    expect(result).toContainEqual(
      expect.stringMatching(/^10: розділ «Як розв'язувати» поза форматом/)
    )
    expect(result).toContainEqual(expect.stringMatching(/немає розділу «## Пастки»/))
  })

  it("усі зламані формули одразу, з рядками", async () => {
    const result = await messages(
      theory("## Коротко\n\n$\\frac{1}{$\n\nі $\\sqrt{$\n\n## Приклади\n\n## Пастки\n")
    )
    const formulas = result.filter((m) => m.includes("Помилка у формулі"))
    expect(formulas).toHaveLength(2)
    expect(formulas[0]).toMatch(/^8:/)
  })

  it("словник, мінус і десяткова крапка поза формулами, | у таблиці", async () => {
    const body = [
      "## Коротко",
      "",
      "На уроці число -5 і 0.25.",
      "",
      "| a | b |",
      "|---|---|",
      "| $|x|$ | 1 |",
      "",
      "## Приклади",
      "",
      "## Пастки",
      "",
    ].join("\n")
    const result = await messages(theory(body))
    expect(result).toContainEqual(expect.stringMatching(/^8: словник: «урок»/))
    expect(result).toContainEqual(expect.stringMatching(/^8: мінус перед числом/))
    expect(result).toContainEqual(expect.stringMatching(/^8: десяткова крапка/))
    expect(result).toContainEqual(expect.stringMatching(/^12: формула в таблиці розірвана/))
  })

  it("помилки frontmatter — з рядком поля", async () => {
    const result = await messages(
      theory("## Коротко\n\n## Приклади\n\n## Пастки\n", "title: Тема\ntrainer:\n  tags: {}")
    )
    expect(result).toContainEqual(
      expect.stringMatching(/^3: trainer: блок trainer можна описувати лише у файлі practice\.mdx/)
    )
  })

  it("зламаний MDX (фігурні дужки) — помилка з рядком", async () => {
    const result = await messages(
      theory("## Коротко\n\nмножина {1; 2}\n\n## Приклади\n\n## Пастки\n")
    )
    expect(result).toContainEqual(expect.stringMatching(/^8: MDX:/))
  })
})

describe("checkStructure", () => {
  it("реальний контент проходить", async () => {
    expect(await checkStructure()).toEqual([])
  })
})
