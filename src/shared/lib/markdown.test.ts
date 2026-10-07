import { describe, expect, it } from "vitest"

import { createMarkdown } from "./markdown"

const md = createMarkdown()

describe("inline", () => {
  it("рендерить формули, макроси множин і Markdown без обгортки <p>", async () => {
    const html = await md.inline("Число $5 \\in \\N$ — **натуральне**")
    expect(html).toContain('class="katex"')
    expect(html).toContain("<strong>натуральне</strong>")
    expect(html).not.toContain("<p>")
  })

  it("відмовляється від блоків замість рядка", async () => {
    await expect(md.inline("- пункт списку")).rejects.toThrow(/один рядок/)
    await expect(md.inline("абзац 1\n\nабзац 2")).rejects.toThrow(/один рядок/)
    await expect(md.inline("")).rejects.toThrow(/один рядок/)
  })

  it("зламана формула — помилка з текстом, а не червоний напис на сторінці", async () => {
    const broken = "Дріб $\\frac{1}{$ без знаменника"
    await expect(md.inline(broken)).rejects.toThrow(/Помилка у формулі/)
    await expect(md.inline(broken)).rejects.toThrow(/без знаменника/)
  })
})

describe("block", () => {
  it("рендерить кілька абзаців, виносні формули й таблиці GFM", async () => {
    const html = await md.block(
      "Розв'яжи систему:\n\n$$\n\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}\n$$\n\n| $x$ | $y$ |\n| --- | --- |\n| 3 | 2 |"
    )
    expect(html).toContain("<p>Розв'яжи систему:</p>")
    expect(html).toContain("katex-display")
    expect(html).toContain("<table>")
  })
})
