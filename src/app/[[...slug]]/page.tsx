import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { createRelativeLink } from "fumadocs-ui/mdx"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getMDXComponents } from "@/components/mdx"
import { TopicSwitch } from "@/components/TopicSwitch"
import { Trainer } from "@/components/trainer/Trainer"
import { source, type ContentPage } from "@/lib/source"
import { topicOf } from "@/lib/topics"

/**
 * У меню практика стоїть під тією ж назвою, що й теорія, тож у заголовку додаємо префікс:
 * «Числові множини» → «Практика: числові множини».
 */
function pageTitle(page: ContentPage) {
  const { title } = page.data
  if (topicOf(page.slugs)?.section !== "practice") return title
  return `Практика: ${title.charAt(0).toLocaleLowerCase("uk") + title.slice(1)}`
}

export default async function Page(props: PageProps<"/[[...slug]]">) {
  const { slug } = await props.params
  const page = source.getPage(slug)
  if (!page) notFound()

  const topic = topicOf(page.slugs)
  const isPractice = topic?.section === "practice"
  const MDX = page.data.body

  return (
    <DocsPage
      toc={page.data.toc}
      tableOfContent={{ enabled: !isPractice }}
      tableOfContentPopover={{ enabled: !isPractice }}
    >
      <DocsTitle>{pageTitle(page)}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      {topic && (
        <div className="border-b pb-6">
          <TopicSwitch topic={topic} />
        </div>
      )}
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
            Trainer: () => <Trainer page={page} />,
          })}
        />
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
    // головна — просто назва сайту, решта — за шаблоном «Сторінка · Математика НМТ»
    title: page.slugs.length === 0 ? { absolute: "Математика · НМТ" } : pageTitle(page),
    description: page.data.description,
  }
}
