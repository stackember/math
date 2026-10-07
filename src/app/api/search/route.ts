import { createFromSource } from "fumadocs-core/search/server"

import { source } from "@/features/content/model/source"

export const { GET } = createFromSource(source)
