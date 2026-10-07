"use client"

import dynamic from "next/dynamic"

/**
 * Тренажер рендериться лише в браузері: порядок завдань і варіантів випадковий,
 * а результати беруться з localStorage — серверний рендер дав би інший HTML,
 * ніж браузер (помилка гідрації).
 */
export const TrainerLoader = dynamic(() => import("./TrainerCard"), {
  ssr: false,
  loading: () => <p className="text-muted-foreground">Завантаження тренажера…</p>,
})
