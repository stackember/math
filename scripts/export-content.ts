/**
 * Експорт контенту в JSON — seed для майбутньої бази даних і доказ, що весь контент парситься:
 *   npm run export   →  dist/content/content.json (предмети → теми → теорія і практики з id)
 *                        dist/content/schema/*.json (JSON Schema з тих самих Zod-схем, на профіль)
 * Теорія експортується як MDX-текст з метаданими; практики — валідовані завдання до рендеру.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

import { parse } from "yaml"
import { z } from "zod"

import { subjects } from "@/features/content/model/subject"
import {
  CONTENT_DIR,
  theoryFile,
  topicPage,
  urlOf,
  type Topic,
} from "@/features/content/model/topic"
import { EXAM_PROFILES, profileOf } from "@/features/trainer/model/exam/registry"
import { questionSchema } from "@/features/trainer/model/question/registry"
import { trainerSchema } from "@/features/trainer/model/schema"

const OUT = "dist/content"

interface Frontmatter {
  title: string
  description?: string
  trainer?: unknown
}

function split(source: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  if (!match) throw new Error("немає frontmatter")
  return { frontmatter: parse(match[1]) as Frontmatter, body: source.slice(match[0].length).trim() }
}

interface ExportedTopic extends Topic {
  id: string
  url: string
  theory?: { title: string; description?: string; mdx: string }
  practice?: { title: string; description?: string; exam: string; trainer: unknown }
}

async function exportTopics() {
  const files = (await readdir(CONTENT_DIR, { recursive: true }))
    .map((f) => String(f).replace(/\\/g, "/"))
    .filter((f) => /\.mdx?$/.test(f))
  const topics = new Map<string, ExportedTopic>()
  const all = subjects()

  for (const file of files) {
    const page = topicPage(file)
    if (!page || page.kind === "subpage") continue
    const { topic } = page
    const id = `${topic.subject}/${topic.slug}`
    const entry = topics.get(id) ?? { ...topic, id, url: urlOf(theoryFile(topic)) }
    const { frontmatter, body } = split(await readFile(join(CONTENT_DIR, file), "utf8"))
    const { title, description } = frontmatter

    if (page.kind === "theory") entry.theory = { title, description, mdx: body }
    else {
      const subject = all.find((s) => s.slug === topic.subject)
      if (!subject) throw new Error(`${file}: предмет «${topic.subject}» без meta.json`)
      const trainer = trainerSchema(profileOf(subject.exam)).parse(frontmatter.trainer)
      // стабільний id завдання: явний або за позицією — так само, як бачить його тренажер
      const questions = trainer.questions.map((q, i) => ({ ...q, id: q.id ?? `${id}/${i}` }))
      entry.practice = {
        title,
        description,
        exam: subject.exam,
        trainer: { ...trainer, questions },
      }
    }
    topics.set(id, entry)
  }
  return [...topics.values()]
}

async function main() {
  await mkdir(join(OUT, "schema"), { recursive: true })
  const content = {
    exportedAt: new Date().toISOString(),
    subjects: subjects(),
    topics: await exportTopics(),
  }
  await writeFile(join(OUT, "content.json"), JSON.stringify(content, null, 2))

  for (const profile of Object.values(EXAM_PROFILES)) {
    const schemas = {
      question: z.toJSONSchema(questionSchema(profile), { io: "input" }),
      practice: z.toJSONSchema(trainerSchema(profile), { io: "input" }),
    }
    for (const [name, schema] of Object.entries(schemas)) {
      await writeFile(
        join(OUT, "schema", `${profile.id}.${name}.json`),
        JSON.stringify(schema, null, 2)
      )
    }
  }
  console.log(
    `Експортовано ${content.subjects.length} предметів, ${content.topics.length} тем → ${OUT}/`
  )
}

await main()
