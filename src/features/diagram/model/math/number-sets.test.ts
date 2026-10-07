import { describe, expect, it } from "vitest"

import { captionTex, EXAMPLES, membership } from "./number-sets"

describe("membership", () => {
  it("число належить своїй множині і всім більшим", () => {
    expect(membership("N")).toEqual(["N", "Z", "Q", "R"])
    expect(membership("Q")).toEqual(["Q", "R"])
    expect(membership("I")).toEqual(["I", "R"])
    expect(membership("R")).toEqual(["R"])
  })
})

describe("captionTex", () => {
  it("каже, де число є і де його вже немає", () => {
    expect(captionTex("-1", "Z")).toBe(String.raw`-1 \in \Z,\ \Q,\ \R;\quad -1 \notin \N`)
    expect(captionTex(String.raw`\sqrt2`, "I")).toBe(
      String.raw`\sqrt2 \in \I,\ \R;\quad \sqrt2 \notin \Q`
    )
  })

  it("для натуральних немає «не належить»", () => {
    expect(captionTex("1", "N")).toBe(String.raw`1 \in \N,\ \Z,\ \Q,\ \R`)
  })
})

it("у кожної множини, крім R, є приклади", () => {
  const homes = new Set(EXAMPLES.map((e) => e.home))
  expect([...homes].sort()).toEqual(["I", "N", "Q", "Z"])
})
