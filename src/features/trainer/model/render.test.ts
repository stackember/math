import { describe, expect, it } from "vitest"

import { createMarkdown } from "@/shared/lib/markdown"

import { DEFAULT_PROFILE as profile } from "./exam/registry"
import { renderTrainer } from "./render"
import type { TrainerData } from "./schema"

const md = createMarkdown()
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>').toString("base64")
const readAsset = async (src: string) => {
  if (src !== "./figures/ok.svg") throw new Error(`немає файлу ${src}`)
  return { mime: "image/svg+xml", base64: svg }
}

describe("renderTrainer", () => {
  it("рендерить формули в завданнях і назвах тегів, умову — блоками", async () => {
    const trainer: TrainerData = {
      tags: { symbols: "Значки $\\in$" },
      questions: [
        {
          type: "short",
          level: 1,
          tag: "symbols",
          q: "Розв'яжи:\n\n$$\nx + 2 = 4\n$$",
          why: "$2$",
          answer: 2,
        },
      ],
    }
    const rendered = await renderTrainer(trainer, { md, profile, readAsset })
    expect(rendered.tags.symbols).toContain('class="katex"')
    expect(rendered.questions[0]).toMatchObject({ index: 0, type: "short", answer: 2 })
    expect(rendered.exam).toBe(profile.id)
    expect(rendered.questions[0].q).toContain("katex-display")
    expect(rendered.questions[0].figureHtml).toBeUndefined()
  })

  it("вбудовує рисунок даними, а відсутній файл — помилка", async () => {
    const base = {
      type: "short" as const,
      level: 1 as const,
      tag: "t",
      q: "q",
      why: "w",
      answer: 1,
    }
    const withFigure: TrainerData = {
      tags: { t: "Т" },
      questions: [{ ...base, figure: { src: "./figures/ok.svg", alt: "Трикутник" } }],
    }
    const rendered = await renderTrainer(withFigure, { md, profile, readAsset })
    expect(rendered.questions[0].figureHtml).toContain(`src="data:image/svg+xml;base64,${svg}"`)
    expect(rendered.questions[0].figureHtml).toContain('alt="Трикутник"')

    const missing: TrainerData = {
      tags: { t: "Т" },
      questions: [{ ...base, figure: { src: "./figures/no.svg", alt: "x" } }],
    }
    await expect(renderTrainer(missing, { md, profile, readAsset })).rejects.toThrow(/немає файлу/)
  })
})
