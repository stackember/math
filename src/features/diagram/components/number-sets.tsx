import katex from "katex"

import { latexToText } from "@/shared/lib/latex-text"
import { katexOptions } from "@/shared/lib/math"

import { captionTex, EXAMPLES, membership, SET_NAMES, type SetId } from "../model/number-sets"
import { NumberSetsDiagram, type DiagramItem, type DiagramSet } from "./number-sets-diagram"

const tex = (source: string) => katex.renderToString(source, katexOptions)

/** Схема числових множин для MDX: `<NumberSets />`. Формули рендеряться на сервері під час збирання. */
export function NumberSets() {
  const sets = Object.fromEntries(
    (Object.keys(SET_NAMES) as SetId[]).map((id) => [
      id,
      { name: SET_NAMES[id], letterHtml: tex(`\\${id}`) } satisfies DiagramSet,
    ])
  ) as Record<SetId, DiagramSet>

  const items: DiagramItem[] = EXAMPLES.map(({ tex: source, home }) => ({
    html: tex(source),
    label: latexToText(source),
    home,
    sets: membership(home),
    captionHtml: tex(captionTex(source, home)),
  }))

  return <NumberSetsDiagram sets={sets} items={items} />
}
