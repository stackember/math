import { describe, expect, it } from "vitest"

import { formatNumber, parseNumber } from "./number"

describe("parseNumber", () => {
  it.each([
    ["4", 4],
    ["−2,5", -2.5],
    ["-2.5", -2.5],
    [" - 5 / 2 ", -2.5],
    ["0,75", 0.75],
  ])("%s → %d", (input, expected) => {
    expect(parseNumber(input)).toBe(expected)
  })

  it.each(["", "abc", "2,5,1", "1/0", "2.", "--3"])("«%s» — не число", (input) => {
    expect(parseNumber(input)).toBeNull()
  })
})

describe("formatNumber", () => {
  it("пише мінус і десяткову кому як у підручнику", () => {
    expect(formatNumber(-2.5)).toBe("−2,5")
    expect(formatNumber(4)).toBe("4")
  })
})
