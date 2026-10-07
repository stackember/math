import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import type { Metadata } from "next"

import { practiceSources } from "@/features/content/model/practices"
import { MixedTrainer } from "@/features/trainer/components/mixed-trainer"
import { EXAM } from "@/features/trainer/model/exam"

const TITLE = "Змішаний тест"
const DESCRIPTION = `Завдання з усіх тем упереміш, у складі ${EXAM.name}: ${EXAM.mixed.choice} з вибором відповіді, ${EXAM.mixed.match} на відповідність, ${EXAM.mixed.short} з короткою відповіддю — скільки дозволяє банк практик.`

export const metadata: Metadata = { title: TITLE, description: DESCRIPTION }

/** Змішаний тест з усіх практик: набір складається в браузері, прогрес — окремо від тем. */
export default function TestPage() {
  const sources = practiceSources().map(({ slug, title, trainer }) => ({ slug, title, trainer }))
  return (
    <DocsPage footer={{ enabled: false }}>
      <DocsTitle>{TITLE}</DocsTitle>
      <DocsDescription className="mb-0">{DESCRIPTION}</DocsDescription>
      <DocsBody>
        <MixedTrainer sources={sources} />
      </DocsBody>
    </DocsPage>
  )
}
