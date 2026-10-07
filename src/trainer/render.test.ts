import { describe, expect, it } from "vitest"

import { renderInline, renderTrainer } from "./render"
import type { TrainerData } from "./schema"

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

  it("зламана формула — помилка з текстом, а не червоний напис на сторінці", async () => {
    const broken = "Дріб $\\frac{1}{$ без знаменника"
    await expect(renderInline(broken)).rejects.toThrow(/Помилка у формулі/)
    await expect(renderInline(broken)).rejects.toThrow(/без знаменника/)
  })
})

describe("renderTrainer", () => {
  it("рендерить формули і в завданнях, і в назвах тегів", async () => {
    const trainer: TrainerData = {
      tags: { symbols: "Значки $\\in$" },
      questions: [{ type: "short", level: 1, tag: "symbols", q: "$2+2$?", why: "$4$", answer: 4 }],
    }
    const rendered = await renderTrainer(trainer)
    expect(rendered.tags.symbols).toContain('class="katex"')
    expect(rendered.questions[0]).toMatchObject({ id: 0, type: "short", answer: 4 })
    expect(rendered.questions[0].q).toContain('class="katex"')
  })
})
