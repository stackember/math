import { createMDX } from "fumadocs-mdx/next"

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Корінь проєкту явно: інакше Next шукає lock-файли в батьківських папках
  turbopack: { root: import.meta.dirname },
}

export default withMDX(config)
