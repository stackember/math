/**
 * LaTeX → читабельний текст для індексу пошуку: `5 \cdot (-4)` → `5 · (−4)`.
 * Не повноцінний парсер — лише конструкції, які трапляються в шкільній математиці.
 * На рендер сторінок не впливає (там KaTeX).
 */
const SYMBOLS: Record<string, string> = {
  N: "N",
  Z: "Z",
  Q: "Q",
  I: "I",
  R: "R",
  in: "∈",
  notin: "∉",
  subset: "⊂",
  subseteq: "⊆",
  cup: "∪",
  cap: "∩",
  setminus: "∖",
  le: "≤",
  leq: "≤",
  ge: "≥",
  geq: "≥",
  ne: "≠",
  neq: "≠",
  approx: "≈",
  pm: "±",
  cdot: "·",
  times: "×",
  div: "÷",
  pi: "π",
  infty: "∞",
  dots: "…",
  ldots: "…",
  to: "→",
  lvert: "|",
  rvert: "|",
  left: "",
  right: "",
  quad: " ",
  qquad: " ",
}

const SUPERSCRIPTS: Record<string, string> = { "2": "²", "3": "³" }

/** Аргумент команди: `{...}` або один символ (`\frac12`, `\sqrt2`). */
const ARG = String.raw`(?:\{([^{}]*)\}|(\w))`

export function latexToText(tex: string): string {
  // десяткова кома {,} → , (першою: інакше дужки заважають розібрати \sqrt{0{,}25})
  let s = tex.replace(/\{,\}/g, ",")
  // \text{...}, \mathbf{...}, \mathbb{...} → вміст
  s = s.replace(/\\(?:text|mathrm|mathbf|mathbb)\{([^{}]*)\}/g, "$1")
  // \frac{a}{b} → a/b; \sqrt{x} → √x (зсередини назовні, доки є що замінювати)
  for (let previous = ""; previous !== s;) {
    previous = s
    s = s.replace(new RegExp(String.raw`\\frac${ARG}${ARG}`, "g"), (_, a1, a2, b1, b2) => {
      return `${a1 ?? a2}/${b1 ?? b2}`
    })
    s = s.replace(new RegExp(String.raw`\\sqrt${ARG}`, "g"), (_, a1, a2) => `√${a1 ?? a2}`)
  }
  // ^2, ^3 → ², ³; інші степені — ^n
  s = s.replace(/\^\{?([23])\}?/g, (_, d: string) => SUPERSCRIPTS[d])
  // \cmd → символ; невідомі команди — без бекслеша
  s = s.replace(/\\([a-zA-Z]+)/g, (_, cmd: string) => SYMBOLS[cmd] ?? cmd)
  // \, \; \! та інші пробільні команди → пробіл
  s = s.replace(/\\[,;:! ]/g, " ")
  s = s.replace(/[{}]/g, "")
  s = s.replace(/-/g, "−")
  return s.replace(/\s+/g, " ").trim()
}
