import { createMDX } from "fumadocs-mdx/next"

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Корінь проєкту явно: інакше Next шукає lock-файли в батьківських папках
  turbopack: { root: import.meta.dirname },
  // Адреси до появи предметів: усе лежало в корені, тепер — у content/math
  async redirects() {
    return [
      { source: "/numbers/:path*", destination: "/math/numbers/:path*", permanent: true },
      { source: "/test", destination: "/math/test", permanent: true },
      { source: "/progress", destination: "/math/progress", permanent: true },
    ]
  },
}

export default withMDX(config)
