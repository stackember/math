import { createFromSource } from "fumadocs-core/search/server"

import { source } from "@/content/source"

export const { GET } = createFromSource(source)
