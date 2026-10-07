import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import type { Metadata } from "next"

import { practiceSources } from "@/features/content/model/practices"
import { ProgressOverview } from "@/features/trainer/components/progress-overview"

const TITLE = "Прогрес"
const DESCRIPTION =
  "Результати за всіма темами й правилами з цього браузера: що вже засвоєно, а що варто повторити."

export const metadata: Metadata = { title: TITLE, description: DESCRIPTION }

/** Сторінка прогресу: список тем — з контенту, результати — зі сховища браузера. */
export default function ProgressPage() {
  const topics = practiceSources().map(({ slug, title, url, trainer }) => ({
    id: slug,
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
        <ProgressOverview topics={topics} />
      </DocsBody>
    </DocsPage>
  )
}
