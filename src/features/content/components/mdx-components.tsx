import { Step, Steps } from "fumadocs-ui/components/steps"
import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"

import { NumberSets } from "@/features/diagram/components/math/number-sets"

import { Subjects } from "./subjects"

/** Компоненти, доступні в MDX без імпорту: стандартні Fumadocs (Callout, Cards…), Steps, схеми, картки предметів. */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Steps,
    Step,
    NumberSets,
    Subjects,
    ...components,
  } satisfies MDXComponents
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
