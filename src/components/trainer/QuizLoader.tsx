"use client"

import dynamic from "next/dynamic"

/**
 * Тренажер рендериться лише в браузері: порядок завдань і варіантів випадковий,
 * а результати беруться з localStorage — серверний рендер дав би інший HTML,
 * ніж браузер (помилка гідрації).
 */
export const QuizLoader = dynamic(() => import("./Quiz"), {
  ssr: false,
  loading: () => <p className="text-muted-foreground">Завантаження тренажера…</p>,
})
