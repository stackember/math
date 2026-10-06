import { DocsBody, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import Link from "next/link"

export default function NotFound() {
  return (
    <DocsPage>
      <DocsTitle>Сторінку не знайдено</DocsTitle>
      <DocsBody>
        <p>Такої сторінки немає: можливо, тему перейменували або прибрали.</p>
        <p>
          <Link href="/">На головну</Link>
        </p>
      </DocsBody>
    </DocsPage>
  )
}
