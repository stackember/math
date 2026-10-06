import "katex/dist/katex.css"
import "./global.css"

import { DocsLayout } from "fumadocs-ui/layouts/docs"
import { RootProvider } from "fumadocs-ui/provider/next"
import { Sigma } from "lucide-react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { translations } from "@/lib/i18n"
import { source } from "@/lib/source"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: { default: "Математика · НМТ", template: "%s · Математика НМТ" },
  description: "Особиста підготовка до НМТ з математики: теорія і практика за темами.",
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
                  Математика · НМТ
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
