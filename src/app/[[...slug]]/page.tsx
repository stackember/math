import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { createRelativeLink } from "fumadocs-ui/mdx"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getMDXComponents } from "@/features/content/components/mdx-components"
import { TopicSwitch } from "@/features/content/components/topic-switch"
import { source } from "@/features/content/model/source"
import { isPractice, topicOf } from "@/features/content/model/topic"
import { Trainer } from "@/features/trainer/components/trainer"
import { EXAM } from "@/features/trainer/model/exam"
import { storageKey } from "@/features/trainer/model/storage"

export default async function Page(props: PageProps<"/[[...slug]]">) {
  const { slug } = await props.params
  const page = source.getPage(slug)
  if (!page) notFound()

  const topic = topicOf(page.slugs)
  const practice = isPractice(page.slugs)
  const MDX = page.data.body

  return (
    <DocsPage
      toc={page.data.toc}
      tableOfContent={{ enabled: !practice }}
      tableOfContentPopover={{ enabled: !practice }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      {topic && (
        <div className="border-b pb-6">
          <TopicSwitch slugs={page.slugs} />
        </div>
      )}
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
        {/* Тренажер є на кожній практиці: схема frontmatter вимагає `trainer` у practice.mdx */}
        {page.data.trainer && topic && (
          <Trainer
            trainer={page.data.trainer}
            storageKey={storageKey(topic.slug)}
            legacyStorageKey={storageKey(`practice/${topic.slug}`)}
          />
        )}
      </DocsBody>
    </DocsPage>
  )
}

export function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: PageProps<"/[[...slug]]">): Promise<Metadata> {
  const { slug } = await props.params
  const page = source.getPage(slug)
  if (!page) notFound()

  return {
    // головна — просто назва сайту, решта — за шаблоном з layout.tsx
    title: page.slugs.length === 0 ? { absolute: EXAM.siteTitle } : page.data.title,
    description: page.data.description,
  }
}
