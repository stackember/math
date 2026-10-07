"use client"

import { Button } from "@/shared/ui/button"

/**
 * Помилка під час показу сторінки (наприклад, у тренажері): пояснення замість порожнього екрана.
 * Макет із меню лишається, бо цей файл стосується лише вмісту сторінки.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto w-full max-w-xl space-y-4 p-8">
      <h1 className="text-2xl font-bold">Сторінку не вдалося показати</h1>
      <p className="text-muted-foreground">
        Щось зламалося під час відображення. Спробуй ще раз або онови сторінку; якщо не допоможе —
        очисти дані цього сайту в браузері.
      </p>
      <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{error.message}</pre>
      <Button onClick={reset}>Спробувати ще раз</Button>
    </main>
  )
}
