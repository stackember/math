/** Дані схеми числових множин: вкладеність, назви, приклади чисел. Без React і KaTeX. */
export type SetId = "N" | "Z" | "Q" | "I" | "R"

/** Куди входить кожна множина (найближча більша): N ⊂ Z ⊂ Q ⊂ R, I ⊂ R. */
const PARENT: Record<SetId, SetId | null> = { N: "Z", Z: "Q", Q: "R", I: "R", R: null }

export const SET_NAMES: Record<SetId, string> = {
  N: "натуральні",
  Z: "цілі",
  Q: "раціональні",
  I: "ірраціональні",
  R: "дійсні",
}

/** Найближча множина, до якої число з такою «домашньою» множиною вже не належить. */
const NOT_IN: Partial<Record<SetId, SetId>> = { Z: "N", Q: "Z", I: "Q" }

/** Приклади чисел і «домашня» (найменша) множина кожного. */
export const EXAMPLES: { tex: string; home: SetId }[] = [
  { tex: "1", home: "N" },
  { tex: "2", home: "N" },
  { tex: "3", home: "N" },
  { tex: "0", home: "Z" },
  { tex: "-1", home: "Z" },
  { tex: "-2", home: "Z" },
  { tex: String.raw`\frac12`, home: "Q" },
  { tex: String.raw`-0{,}75`, home: "Q" },
  { tex: String.raw`0{,}(3)`, home: "Q" },
  { tex: String.raw`\sqrt2`, home: "I" },
  { tex: String.raw`\sqrt5`, home: "I" },
  { tex: String.raw`\pi`, home: "I" },
]

/** Усі множини, яким належить число: домашня і всі більші за ланцюжком PARENT. */
export function membership(home: SetId): SetId[] {
  const chain: SetId[] = [home]
  for (let next = PARENT[home]; next; next = PARENT[next]) chain.push(next)
  return chain
}

/** LaTeX підпису «x ∈ Z, Q, R; x ∉ N». */
export function captionTex(tex: string, home: SetId): string {
  const member = `${tex} \\in ${membership(home)
    .map((id) => `\\${id}`)
    .join(",\\ ")}`
  const notIn = NOT_IN[home]
  return notIn ? `${member};\\quad ${tex} \\notin \\${notIn}` : member
}
