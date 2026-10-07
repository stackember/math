import { readdirSync, readFileSync } from "node:fs"
import { sep } from "node:path"

import { parse } from "yaml"
import { describe, expect, it } from "vitest"

import { moduleOf } from "@/features/trainer/model/question/registry"
import type { RenderedTrainer } from "@/features/trainer/model/schema"
import { createSession, score, sessionReducer } from "@/features/trainer/model/session"

import { frontmatterSchema } from "./frontmatter"

/**
 * Кожна практика з content/ проходиться до кінця через reducer тренажера — за секунди, без браузера:
 * та сама схема й рендер, що під час збирання, еталонні чернетки з модулів типів.
 * Нова практика чи новий тип завдання потрапляють сюди самі; e2e лишає по одному сценарію на тип.
 */
const CONTENT = "content"
const PRACTICES = readdirSync(CONTENT, { recursive: true })
  .map((file) => `${CONTENT}/${String(file).split(sep).join("/")}`)
  .filter((file) => file.endsWith("/practice.mdx"))

async function renderedTrainer(file: string): Promise<RenderedTrainer> {
  const source = readFileSync(file, "utf8")
  const yaml = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? ""
  const result = await frontmatterSchema({ path: file, source })["~standard"].validate(parse(yaml))
  expect(result.issues, JSON.stringify(result.issues)).toBeUndefined()
  return (result as { value: { trainer: RenderedTrainer } }).value.trainer
}

describe.each(PRACTICES)("%s", (file) => {
  it("кожне завдання: правильна чернетка зараховується, неправильна — ні", async () => {
    const { questions } = await renderedTrainer(file)
    for (const question of questions) {
      const m = moduleOf(question)
      const correct = m.correctDraft(question)
      const wrong = m.wrongDraft(question)
      const label = `завдання ${question.id + 1} (${question.type})`

      expect(m.invalidReason(correct), label).toBeNull()
      expect(m.isCorrect(question, correct), label).toBe(true)
      expect(m.invalidReason(wrong), label).toBeNull()
      expect(m.isCorrect(question, wrong), label).toBe(false)
      expect(m.answerHtml(question, m.displayOrder(question, () => 0)), label).not.toBe("")
    }
  })

  it("повне проходження з правильними відповідями дає N/N", async () => {
    const { questions } = await renderedTrainer(file)
    let session = createSession(questions, "full")
    for (const step of session.steps) {
      const m = moduleOf(step.question)
      session = sessionReducer(session, {
        type: "answer",
        update: () => m.correctDraft(step.question),
      })
      session = sessionReducer(session, { type: "check" })
      session = sessionReducer(session, { type: "next" })
    }
    expect(score(session)).toBe(questions.length)
  })
})
