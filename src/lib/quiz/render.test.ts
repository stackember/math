import { describe, expect, it } from "vitest"

import { renderInline, renderQuiz } from "./render"
import type { Quiz } from "./schema"

describe("renderInline", () => {
  it("рендерить формули, макроси множин і Markdown в один рядок", async () => {
    const html = await renderInline("Число $5 \\in \\N$ — **натуральне**")
    expect(html).toContain('class="katex"')
    expect(html).toContain("<strong>натуральне</strong>")
    expect(html).not.toContain("<p>")
  })

  it("відмовляється рендерити блоки замість рядка", async () => {
    await expect(renderInline("- пункт списку")).rejects.toThrow(/один рядок/)
    await expect(renderInline("абзац 1\n\nабзац 2")).rejects.toThrow(/один рядок/)
  })
})

describe("renderQuiz", () => {
  it("рендерить формули і в завданнях, і в назвах тегів", async () => {
    const quiz: Quiz = {
      tags: { symbols: "Значки $\\in$" },
      questions: [{ type: "short", level: 1, tag: "symbols", q: "$2+2$?", why: "$4$", answer: 4 }],
    }
    const rendered = await renderQuiz(quiz)
    expect(rendered.tags.symbols).toContain('class="katex"')
    expect(rendered.questions[0]).toMatchObject({ id: 0, type: "short", answer: 4 })
    expect(rendered.questions[0].q).toContain('class="katex"')
  })
})
