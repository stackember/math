import { Card, Cards } from "fumadocs-ui/components/card"

import { practiceSources } from "../model/practices"
import { subjects } from "../model/subject"

/** Головна: картка на кожен предмет — огляд, кількість тем з практикою, змішаний тест і прогрес. */
export function Subjects() {
  const practices = practiceSources()
  return (
    <Cards>
      {subjects().map((subject) => {
        const count = practices.filter((p) => p.subject === subject.slug).length
        return (
          <Card key={subject.slug} href={`/${subject.slug}`} title={subject.title}>
            {subject.description}
            <span className="mt-2 block text-sm text-muted-foreground">
              Практик: {count} · змішаний тест · прогрес
            </span>
          </Card>
        )
      })}
    </Cards>
  )
}
