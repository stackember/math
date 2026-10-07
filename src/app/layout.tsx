import "katex/dist/katex.css"
import "./global.css"

import { DocsLayout } from "fumadocs-ui/layouts/docs"
import { RootProvider } from "fumadocs-ui/provider/next"
import { GraduationCap } from "lucide-react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { source } from "@/features/content/model/source"
import { translations } from "@/shared/lib/i18n"

import { SITE } from "./site"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: { default: SITE.name, template: SITE.titleTemplate },
  description: SITE.description,
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
                  <GraduationCap className="size-5" aria-hidden />
                  {SITE.name}
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
