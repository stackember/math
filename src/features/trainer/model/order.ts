/** Випадковий порядок завдань і варіантів. `random` передається явно, щоб тести були детермінованими. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Від легких до складних; усередині рівня — випадковий порядок. */
export function orderByLevel<T extends { level: 1 | 2 | 3 }>(
  questions: readonly T[],
  random: () => number = Math.random
): T[] {
  return ([1, 2, 3] as const).flatMap((level) =>
    shuffle(
      questions.filter((q) => q.level === level),
      random
    )
  )
}
