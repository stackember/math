import "katex/dist/katex.css"
import "./global.css"

import { DocsLayout } from "fumadocs-ui/layouts/docs"
import { RootProvider } from "fumadocs-ui/provider/next"
import { Sigma } from "lucide-react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { source } from "@/features/content/model/source"
import { translations } from "@/shared/lib/i18n"
import { EXAM } from "@/features/trainer/model/exam"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: { default: EXAM.siteTitle, template: EXAM.titleTemplate },
  description: EXAM.siteDescription,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider i18n={{ locale: "uk", translations }}>
          <DocsLayout
            tree={source.getPageTree()}
            nav={{
              title: (
                <>
                  <Sigma className="size-5" aria-hidden />
                  {EXAM.siteTitle}
                </>
              ),
            }}
          >
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
    </html>
  )
}
