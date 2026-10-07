import type { ExamProfile } from "./profile"

/** НМТ з математики: 22 завдання — 15 з вибором (А–Д), 3 на відповідність (1–3 ↔ А–Д), 4 з короткою відповіддю. */
export const NMT_MATH = {
  id: "nmt-math",
  name: "НМТ з математики",
  letters: ["А", "Б", "В", "Г", "Д"],
  match: { left: 3, right: 5 },
  short: { fields: 2 },
  // поза форматом НМТ — для тренування правил з кількома прикладами
  multi: { options: [3, 5], correct: [2, 4] },
  composition: {
    total: [10, 15],
    levels: { 1: [3, 5], 2: [5, 8], 3: [2, 3] },
    types: { match: [1, 2], short: [2, 3], multi: [0, 2] },
  },
  mixed: { choice: 15, match: 3, short: 4 },
  levels: {
    1: { label: "легке", variant: "secondary" },
    2: { label: "рівень НМТ", variant: "default" },
    3: { label: "пастка", variant: "destructive" },
  },
} as const satisfies ExamProfile
