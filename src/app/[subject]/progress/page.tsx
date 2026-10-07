import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { practiceSources } from "@/features/content/model/practices"
import { subjectOf, subjects } from "@/features/content/model/subject"
import { ProgressOverview } from "@/features/trainer/components/progress-overview"
import { mixedId } from "@/features/trainer/model/mixed"

const TITLE = "Прогрес"
const DESCRIPTION =
  "Результати за темами й правилами предмета з цього браузера: що вже засвоєно, а що варто повторити."

export function generateStaticParams() {
  return subjects().map((subject) => ({ subject: subject.slug }))
}

export async function generateMetadata(props: PageProps<"/[subject]/progress">): Promise<Metadata> {
  const subject = subjectOf((await props.params).subject)
  return subject ? { title: `${TITLE} · ${subject.title}`, description: DESCRIPTION } : {}
}

/** Прогрес предмета: список тем — з контенту, результати — зі сховища браузера. */
export default async function ProgressPage(props: PageProps<"/[subject]/progress">) {
  const subject = subjectOf((await props.params).subject)
  if (!subject) notFound()
  const topics = practiceSources({ subject: subject.slug }).map(({ id, title, url, trainer }) => ({
    id,
    title,
    url,
    tags: trainer.tags,
    total: trainer.questions.length,
  }))

  return (
    <DocsPage footer={{ enabled: false }}>
      <DocsTitle>{TITLE}</DocsTitle>
      <DocsDescription className="mb-0">{DESCRIPTION}</DocsDescription>
      <DocsBody>
        <ProgressOverview topics={topics} mixedId={mixedId(subject.exam)} />
      </DocsBody>
    </DocsPage>
  )
}
