/**
 * Число з поля «коротка відповідь».
 * Приймає `4`, `−2,5`, `-2.5`, `-5/2`; повертає `null`, якщо це не число.
 */
export function parseNumber(input: string): number | null {
  const s = input.replace(/\s+/g, "").replace(/[−–]/g, "-").replace(",", ".")
  const fraction = /^(-?\d+)\/(\d+)$/.exec(s)
  if (fraction) {
    const denominator = Number(fraction[2])
    return denominator === 0 ? null : Number(fraction[1]) / denominator
  }
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null
}

/** `-2.5` → `−2,5`: як пишуть у підручниках. */
export function formatNumber(value: number): string {
  return String(value).replace("-", "−").replace(".", ",")
}
