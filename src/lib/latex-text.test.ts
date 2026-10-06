import { describe, expect, it } from "vitest"

import { latexToText } from "./latex-text"

describe("latexToText", () => {
  it.each([
    [String.raw`-17 = 5 \cdot (-4) + 3`, "−17 = 5 · (−4) + 3"],
    [String.raw`\N \subset \Z \subset \Q \subset \R`, "N ⊂ Z ⊂ Q ⊂ R"],
    [String.raw`\sqrt2 \notin \Q`, "√2 ∉ Q"],
    [String.raw`0{,}(3) = \frac13`, "0,(3) = 1/3"],
    [String.raw`\frac{12}{4} = 3`, "12/4 = 3"],
    [String.raw`\sqrt{16} = 4`, "√16 = 4"],
    [String.raw`\sqrt{0{,}25} = 0{,}5`, "√0,25 = 0,5"],
    [String.raw`\sqrt{\frac14}`, "√1/4"],
    [String.raw`\lvert x \rvert \le a`, "| x | ≤ a"],
    [String.raw`n^2 = 25k^2 + 30k + 9`, "n² = 25k² + 30k + 9"],
    [String.raw`2^3 \cdot 3^{2}`, "2³ · 3²"],
    [String.raw`\text{якщо } a \ge 0`, "якщо a ≥ 0"],
    [String.raw`\mathbb{N}, \dots`, "N, …"],
  ])("%s → %s", (tex, text) => {
    expect(latexToText(tex)).toBe(text)
  })
})
