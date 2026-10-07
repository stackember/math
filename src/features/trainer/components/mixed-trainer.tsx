"use client"

import { useMemo, useState } from "react"

import { Button } from "@/shared/ui/button"

import { useMounted } from "../hooks/use-mounted"
import type { ExamProfile } from "../model/exam/profile"
import { composeMixed, mixedId, type MixedSource } from "../model/mixed"
import { TrainerCard } from "./trainer-card"

interface Props {
  sources: MixedSource[]
  profile: ExamProfile
}

/**
 * Змішаний тест: набір складається в браузері після гідрації (випадковий вибір з усіх практик
 * профілю), «Інший набір» складає новий. Прогрес — під ключем профілю, окремо від тем.
 */
export function MixedTrainer({ sources, profile }: Props) {
  const mounted = useMounted()
  const [seed, setSeed] = useState(0)
  // seed у залежностях — щоб кнопка «Інший набір» перескладала тест
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const trainer = useMemo(() => composeMixed(sources, profile), [sources, profile, seed])
  const topics = new Set(trainer.questions.map((q) => q.topic)).size

  if (!mounted) return <p className="text-muted-foreground">Складаємо тест…</p>
  if (trainer.questions.length === 0) {
    return (
      <p className="text-muted-foreground">
        Поки немає жодної практики — немає з чого складати тест.
      </p>
    )
  }

  return (
    <div className="not-prose mt-8 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Завдань: {trainer.questions.length} · тем: {topics}
        </span>
        <Button variant="outline" size="sm" onClick={() => setSeed((s) => s + 1)}>
          Інший набір
        </Button>
      </div>
      <TrainerCard key={seed} trainer={trainer} trainerId={mixedId(profile.id)} />
    </div>
  )
}
