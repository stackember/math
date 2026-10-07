import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { practiceSources } from "@/features/content/model/practices"
import { subjectOf, subjects } from "@/features/content/model/subject"
import { MixedTrainer } from "@/features/trainer/components/mixed-trainer"
import { profileOf } from "@/features/trainer/model/exam/registry"

const TITLE = "Змішаний тест"

/** Склад тесту словами: «15 з вибором відповіді, 3 на відповідність…» з профілю. */
const describe = (mixed: Record<string, number | undefined>) => {
  const names: Record<string, string> = {
    choice: "з вибором відповіді",
    match: "на відповідність",
    short: "з короткою відповіддю",
    multi: "з кількома правильними",
    order: "на послідовність",
  }
  return Object.entries(mixed)
    .filter((entry): entry is [string, number] => !!entry[1])
    .map(([type, n]) => `${n} ${names[type] ?? type}`)
    .join(", ")
}

export function generateStaticParams() {
  return subjects().map((subject) => ({ subject: subject.slug }))
}

export async function generateMetadata(props: PageProps<"/[subject]/test">): Promise<Metadata> {
  const subject = subjectOf((await props.params).subject)
  return subject ? { title: `${TITLE} · ${subject.title}` } : {}
}

/** Змішаний тест предмета: завдання з усіх предметів того самого профілю іспиту, як на реальному тесті. */
export default async function TestPage(props: PageProps<"/[subject]/test">) {
  const subject = subjectOf((await props.params).subject)
  if (!subject) notFound()
  const profile = profileOf(subject.exam)
  const sources = practiceSources({ exam: profile.id }).map(({ id, title, trainer }) => ({
    id,
    title,
    trainer,
  }))

  return (
    <DocsPage footer={{ enabled: false }}>
      <DocsTitle>{TITLE}</DocsTitle>
      <DocsDescription className="mb-0">
        Завдання з усіх тем упереміш, у складі «{profile.name}»: {describe(profile.mixed)} — скільки
        дозволяє банк практик.
      </DocsDescription>
      <DocsBody>
        <MixedTrainer sources={sources} profile={profile} />
      </DocsBody>
    </DocsPage>
  )
}
