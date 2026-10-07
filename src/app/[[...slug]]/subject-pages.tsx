import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import type { Metadata } from "next"

import { practiceSources } from "@/features/content/model/practices"
import { subjectOf, subjects, type Subject } from "@/features/content/model/subject"
import { MixedTrainer } from "@/features/trainer/components/mixed-trainer"
import { ProgressOverview } from "@/features/trainer/components/progress-overview"
import { profileOf } from "@/features/trainer/model/exam/registry"
import { mixedId } from "@/features/trainer/model/mixed"

/**
 * Сторінки предмета поза контентом: /<предмет>/test і /<предмет>/progress.
 * Живуть у тому самому catch-all маршруті, що й контент, бо Next робить prefetch посилань
 * сегментом поточного маршруту — окремий маршрут давав 404 на кожен prefetch з меню.
 */
const PAGES = {
  test: {
    title: "Змішаний тест",
    description: (subject: Subject) => {
      const profile = profileOf(subject.exam)
      return `Завдання з усіх тем упереміш, у складі «${profile.name}»: ${describe(profile.mixed)} — скільки дозволяє банк практик.`
    },
    render: (subject: Subject) => {
      const profile = profileOf(subject.exam)
      const sources = practiceSources({ exam: profile.id }).map(({ id, title, trainer }) => ({
        id,
        title,
        trainer,
      }))
      return <MixedTrainer sources={sources} profile={profile} />
    },
  },
  progress: {
    title: "Прогрес",
    description: () =>
      "Результати за темами й правилами предмета з цього браузера: що вже засвоєно, а що варто повторити.",
    render: (subject: Subject) => {
      const topics = practiceSources({ subject: subject.slug }).map(
        ({ id, title, url, trainer }) => ({
          id,
          title,
          url,
          tags: trainer.tags,
          total: trainer.questions.length,
        })
      )
      return <ProgressOverview topics={topics} mixedId={mixedId(subject.exam)} />
    },
  },
} as const

type PageKind = keyof typeof PAGES

/** Склад тесту словами: «15 з вибором відповіді, 3 на відповідність…». */
function describe(mixed: Record<string, number | undefined>) {
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

/** Сторінка предмета за slugs (`[предмет, "test" | "progress"]`), інакше `null`. */
export function subjectPage(slugs: readonly string[]) {
  if (slugs.length !== 2 || !(slugs[1] in PAGES)) return null
  const subject = subjectOf(slugs[0])
  return subject ? { subject, kind: slugs[1] as PageKind } : null
}

/** Параметри для статичного збирання: по дві сторінки на предмет. */
export const subjectPageParams = () =>
  subjects().flatMap((subject) =>
    Object.keys(PAGES).map((kind) => ({ slug: [subject.slug, kind] }))
  )

export function subjectPageMetadata({
  subject,
  kind,
}: NonNullable<ReturnType<typeof subjectPage>>): Metadata {
  const page = PAGES[kind]
  return { title: `${page.title} · ${subject.title}`, description: page.description(subject) }
}

export function SubjectPage({ subject, kind }: NonNullable<ReturnType<typeof subjectPage>>) {
  const page = PAGES[kind]
  return (
    <DocsPage footer={{ enabled: false }}>
      <DocsTitle>{page.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.description(subject)}</DocsDescription>
      <DocsBody>{page.render(subject)}</DocsBody>
    </DocsPage>
  )
}
