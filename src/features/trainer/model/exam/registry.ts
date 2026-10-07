import { z } from "zod"

import { NMT_MATH } from "./nmt-math"
import type { ExamProfile } from "./profile"

/** Реєстр профілів іспитів. Новий іспит — файл поруч + запис тут. */
export const EXAM_PROFILES = { [NMT_MATH.id]: NMT_MATH } satisfies Record<string, ExamProfile>

export type ExamProfileId = keyof typeof EXAM_PROFILES

const IDS = Object.keys(EXAM_PROFILES) as [ExamProfileId, ...ExamProfileId[]]

/** Профіль за замовчуванням — для довідки й прикладів, де предмет невідомий. */
export const DEFAULT_PROFILE: ExamProfile = NMT_MATH

/** `exam` у meta.json предмета. */
export const examProfileIdSchema = z.enum(IDS, {
  error: `exam: профіль іспиту з реєстру — ${IDS.join(", ")}`,
})

export function profileOf(id: string): ExamProfile {
  const profile = (EXAM_PROFILES as Record<string, ExamProfile>)[id]
  if (!profile) throw new Error(`Невідомий профіль іспиту «${id}»: є ${IDS.join(", ")}`)
  return profile
}
