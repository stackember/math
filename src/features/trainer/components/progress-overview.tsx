"use client"

import { Card, CardContent, CardHeader } from "@/shared/ui/card"

import { useMounted } from "../hooks/use-mounted"
import { useProgressOverview } from "../hooks/use-progress-overview"
import type { Overview, TopicInfo, TopicOverview } from "../model/overview"
import type { Progress, Score } from "../model/progress"
import { RuleBars } from "./rule-bars"

const scoreText = (score?: Score) => (score ? `${score.score}/${score.total}` : "—")
const dateText = (at?: number) =>
  at === undefined
    ? ""
    : new Date(at).toLocaleDateString("uk-UA", { day: "numeric", month: "long" })

function Scores({ progress }: { progress: Progress }) {
  const lastAt = progress.attempts.at(-1)?.at
  return (
    <p className="text-sm text-muted-foreground">
      Найкращий результат: <b className="text-foreground">{scoreText(progress.best)}</b> · останній:{" "}
      <b className="text-foreground">{scoreText(progress.last)}</b>
      {progress.attempts.length > 0 && (
        <>
          {" "}
          · проходів: {progress.attempts.length}
          {lastAt !== undefined && `, останній ${dateText(lastAt)}`}
        </>
      )}
    </p>
  )
}

function TopicCard({ topic }: { topic: TopicOverview }) {
  // правила є і без повного проходу практики — зі змішаного тесту
  const hasRules = topic.rules.some((rule) => rule.total > 0)
  return (
    <Card className="gap-3 py-4" data-topic={topic.id}>
      <CardHeader className="gap-1">
        <h2 className="text-lg font-semibold">
          <a href={topic.url} className="hover:underline">
            {topic.title}
          </a>
        </h2>
        {topic.progress.last ? (
          <Scores progress={topic.progress} />
        ) : (
          <p className="text-sm text-muted-foreground">Ще не проходив · {topic.total} завдань</p>
        )}
      </CardHeader>
      {hasRules && (
        <CardContent>
          <RuleBars rules={topic.rules} label={`Правила: ${topic.title}`} />
        </CardContent>
      )}
    </Card>
  )
}

function Summary({ overview, topics }: { overview: Overview; topics: TopicInfo[] }) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader>
        <p className="text-sm text-muted-foreground">
          Тем з практикою: {topics.length} · почато: {overview.started} · повних проходів:{" "}
          {overview.attempts}
        </p>
        {overview.mixed.last && (
          <p className="text-sm text-muted-foreground">
            Змішаний тест — найкращий:{" "}
            <b className="text-foreground">{scoreText(overview.mixed.best)}</b> · останній:{" "}
            <b className="text-foreground">{scoreText(overview.mixed.last)}</b>
          </p>
        )}
      </CardHeader>
      {overview.weak.length > 0 && (
        <CardContent className="space-y-2">
          <h2 className="text-base font-semibold">Слабкі правила</h2>
          <RuleBars
            rules={overview.weak.map((rule) => ({
              ...rule,
              tag: `${rule.topic.id}/${rule.tag}`,
              label: `${rule.topic.title}: ${rule.label}`,
            }))}
            label="Слабкі правила"
          />
        </CardContent>
      )}
    </Card>
  )
}

interface Props {
  topics: TopicInfo[]
  /** Ключ прогресу змішаного тесту профілю предмета. */
  mixedId: string
}

/** Сторінка «Прогрес»: зведення зі сховища браузера — тому лише після монтування. */
export function ProgressOverview(props: Props) {
  const mounted = useMounted()
  return (
    <div className="not-prose mt-8 space-y-4">
      {mounted ? <Loaded {...props} /> : <p className="text-muted-foreground">Читаємо прогрес…</p>}
    </div>
  )
}

function Loaded({ topics, mixedId }: Props) {
  const overview = useProgressOverview(topics, mixedId)
  if (topics.length === 0) {
    return <p className="text-muted-foreground">Поки немає жодної практики.</p>
  }
  return (
    <>
      <Summary overview={overview} topics={topics} />
      {overview.topics.map((topic) => (
        <TopicCard key={topic.id} topic={topic} />
      ))}
      <p className="text-sm text-muted-foreground">
        Результати зберігаються лише в цьому браузері.
      </p>
    </>
  )
}
