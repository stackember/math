import katex from "katex"

import { latexToText } from "@/lib/latex-text"
import { katexOptions } from "@/lib/math"

import { NumberSetsDiagram, type DiagramItem, type SetId } from "./NumberSetsDiagram"

/** Множини: від найменшої до найбільшої, `parents` — куди ще входить. */
const SETS: Record<SetId, { name: string; parents: SetId[]; notIn?: SetId }> = {
  N: { name: "натуральні", parents: ["N", "Z", "Q", "R"] },
  Z: { name: "цілі", parents: ["Z", "Q", "R"], notIn: "N" },
  Q: { name: "раціональні", parents: ["Q", "R"], notIn: "Z" },
  I: { name: "ірраціональні", parents: ["I", "R"], notIn: "Q" },
  R: { name: "дійсні", parents: ["R"] },
}

/** Приклади чисел і «найменша» множина кожного. */
const EXAMPLES: [tex: string, home: SetId][] = [
  ["1", "N"],
  ["2", "N"],
  ["3", "N"],
  ["0", "Z"],
  ["-1", "Z"],
  ["-2", "Z"],
  [String.raw`\frac12`, "Q"],
  [String.raw`-0{,}75`, "Q"],
  [String.raw`0{,}(3)`, "Q"],
  [String.raw`\sqrt2`, "I"],
  [String.raw`\sqrt5`, "I"],
  [String.raw`\pi`, "I"],
]

const tex = (source: string) =>
  katex.renderToString(source, { ...katexOptions, throwOnError: true })

/** «x ∈ Z, Q, R; x ∉ N» — до яких множин число належить і до якої вже ні. */
function caption(source: string, home: SetId) {
  const { parents, notIn } = SETS[home]
  const member = `${source} \\in ${parents.map((id) => `\\${id}`).join(",\\ ")}`
  return notIn ? `${member};\\quad ${source} \\notin \\${notIn}` : member
}

/** Схема числових множин для MDX: `<NumberSets />`. Формули рендеряться на сервері. */
export function NumberSets() {
  const sets = Object.fromEntries(
    Object.entries(SETS).map(([id, { name }]) => [id, { name, letterHtml: tex(`\\${id}`) }])
  ) as Record<SetId, { name: string; letterHtml: string }>

  const items: DiagramItem[] = EXAMPLES.map(([source, home]) => ({
    html: tex(source),
    label: latexToText(source),
    sets: SETS[home].parents,
    captionHtml: tex(caption(source, home)),
  }))

  return <NumberSetsDiagram sets={sets} items={items} />
}
