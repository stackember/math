# Архітектура: оцінка і цільовий стан

## 1. Що є зараз

- `content/theory/<slug>.mdx` і `content/practice/<slug>.mdx` — дві плоскі папки, пара за однаковим slug; порядок практики копіюється з порядку теорії плагіном дерева сторінок (`src/lib/topics.ts`, 82 рядки).
- `src/lib/quiz/*` — чиста логіка тренажера (schema, check, session, render, storage); `src/components/trainer/*` — React; `src/components/diagrams/*` — інтерактивна схема; `src/app/*` — маршрути Fumadocs.
- Перевірки під час збірки: Zod-схема frontmatter, суворий KaTeX, «один рядок» для текстів завдань, «практика без теорії».
- Тести: Vitest поруч із модулями (49), Playwright (29) з автовідкриттям контенту.

## 2. Оцінка

**Добре (лишити):**

- Fumadocs + Next: меню, пошук, зміст, тема — з коробки; власний код лише там, де бібліотек немає (тренажер, схема).
- Логіка тренажера без React: `session.ts` — скінченний автомат з reducer, `check.ts` — чисті функції, усе з тестами. Це зразок для нового коду.
- Формули рендеряться на сервері під час збірки; у браузер іде HTML — KaTeX не потрапляє в клієнтський бандл.
- Помилки збірки з українським поясненням і місцем у файлі (там, де це реалізовано).
- Контент — MDX з YAML, без бази даних і CMS; один файл = одна сторінка.

**Що заважає росту:**

- Плоска модель тем: програма НМТ — це ~8 розділів і 40+ тем; один список у меню і неможливість вкладеності (F3) — глухий кут. Пара теорія↔практика тримається на евристиках дерева (визначення папки за дітьми, парсинг URL), які вже дають хибні або відсутні помилки (F6, F21, F22).
- Тренажер підключено трьома способами (тег у MDX + closure у `page.tsx` + два runtime-throw) — зайві правила для автора й мовчазні збої (F40).
- Три слова для одного поняття в коді: `quiz` (дані), `trainer` (UI, ключ сховища), `practice` (контент). Для AI-підтримки потрібне одне.
- Серверні модулі (`render.ts`, `Trainer.tsx`) не позначені `server-only`: випадковий імпорт із клієнтського компонента затягне `unified`+KaTeX у бандл без помилки.
- Немає `error.tsx`: будь-який виняток у тренажері валить усю сторінку (F9).
- Ключ прогресу похідний від URL (`trainer:practice/<slug>`): переміщення сторінки стирає прогрес.

## 3. Цільова архітектура

### 3.1 Принципи

1. **Контент — це дані.** Усе, що потрібно для теми, лежить в одній папці теми. Жодної логіки в контенті, крім компонентів без імпорту.
2. **Конвенція замість конфігурації.** Що тренажер існує, видно з frontmatter; що сторінка — практика, видно з імені файлу. Ніяких тегів-перемикачів і реєстрацій.
3. **Одна відповідальність на папку:** `app/` — лише маршрути; `trainer/` — усе про тренажер; `content/` (код) — усе про читання контенту; `lib/` — утиліти без домену.
4. **Усе, що може бути перевіркою, — перевірка,** а не правило в документі: структура теорії, унікальність slug, формули, словник.
5. **Чисте ядро, тонкий React:** стан і правила — у функціях з тестами; компоненти лише малюють і диспатчать.
6. **Одне слово на поняття:** практика (сторінка) → тренажер (функція і код) → завдання (елемент), правило (тег).

### 3.2 Контент-модель: співрозташування теми

```
content/
  index.mdx                      «Як вчитися»
  meta.json                      { "pages": ["index", "numbers", "algebra", "equations", "functions", "planimetry", "stereometry", "statistics"] }
  numbers/                       розділ програми
    meta.json                    { "title": "Числа", "icon": "Hash", "pages": ["number-sets", "modulus", "integers", "divisibility", "..."] }
    number-sets/
      index.mdx                  теорія            → /numbers/number-sets
      practice.mdx               практика          → /numbers/number-sets/practice
      periodic-fractions.mdx     підсторінка теорії (за потреби) → /numbers/number-sets/periodic-fractions
      figures/                   svg до теми (за потреби)
    modulus/
      index.mdx
```

| Питання                | Відповідь                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Як додати тему         | створити папку з `index.mdx`, дописати slug у `meta.json` розділу                                                                                        |
| Як додати практику     | створити `practice.mdx` поруч; більше нічого                                                                                                             |
| Як розбити велику тему | підсторінки в тій самій папці; меню покаже їх як дочірні                                                                                                 |
| Меню                   | Розділ ▸ Тема (клік — теорія) ▸ «Практика: …» та підсторінки як дочірні пункти. За бажанням практику ховає 10-рядковий трансформ дерева — не обов'язково |
| Пара теорія↔практика   | `practice.mdx` ↔ `index.mdx` тієї ж папки; жодного пошуку по дереву                                                                                      |
| Назва практики         | явний `title: "Практика: числові множини"` у frontmatter (без обчислення регістру в коді — F10, F23)                                                     |
| Ключ прогресу          | `trainer:<slug теми>` (назва папки, унікальна на сайті — перевірка під час збірки); переміщення теми між розділами не стирає прогрес                     |
| Що зникає              | `src/lib/topics.ts`, `topics.test.ts`, тег `<Trainer />`, closure в `page.tsx`, два throw у `Trainer.tsx`, правило «назва практики = назва теорії»       |

Альтернатива (консервативна): лишити `theory/` і `practice/`, додати підпапки розділів і узагальнити `topics.ts` на шляхи. Дає те саме меню з двома секціями, але зберігає евристики й код, який уже дав 5 знахідок. Не рекомендовано.

### 3.3 Код

```
src/
  app/
    layout.tsx                   шрифт, провайдер, DocsLayout
    [[...slug]]/page.tsx         сторінка контенту: заголовок, кнопка теорія↔практика, MDX, {trainer && <Trainer/>}
    api/search/route.ts          пошук
    error.tsx                    «Щось зламалося» українською (новий)
    not-found.tsx, global.css, icon.svg, sitemap.ts (новий: список URL для e2e і пошуковиків)
  content/                       код про контент (перейменований src/lib/source.ts + частини)
    source.ts                    loader, колекції, плагіни дерева
    frontmatter.ts               схеми: теорія / практика (схема — функція від шляху файлу)
    topic.ts                     isPractice(page), pairOf(page), topicSlug(page) — 20 рядків, без евристик
  trainer/                       одна функція — одна папка
    schema.ts                    RULES + Zod (строго, українські повідомлення)
    check.ts  session.ts  storage.ts  verdict.ts   чиста логіка + тести поруч
    render.ts                    build-time KaTeX/Markdown (`import "server-only"`)
    Trainer.tsx                  серверний вхід (`server-only`) → TrainerLoader (client, ssr:false) → Trainer UI
    ui/                          Quiz, ChoiceAnswer, MatchAnswer, ShortAnswer, Feedback, Results, shared
  diagrams/                      NumberSets (server) + NumberSetsDiagram (client); далі — Mafs-графіки
  components/
    ui/                          shadcn (не правити руками)
    mdx.tsx                      компоненти для MDX
    TopicSwitch.tsx
  lib/                           math.ts (KaTeX), latex-text.ts, i18n.ts, utils.ts
scripts/
  check-content.ts               швидка перевірка контенту (див. REVIEW-AI-WORKFLOW.md)
  print-rules.mjs                друкує RULES для skill
```

Правила розміщення: модуль із `"use client"` імпортує з `trainer/*` лише типи й чисті функції (`check`, `session`, `storage`, `verdict`); `render.ts` і `Trainer.tsx` починаються з `import "server-only"` — порушення стає помилкою збірки, а не тихим ростом бандла.

### 3.4 Потік даних

```
practice.mdx (YAML trainer:{tags,questions} + шпаргалка)
  → fumadocs-mdx: frontmatter → practiceSchema (Zod, build-time, українські помилки)
  → page.tsx: <MDX/> потім {page.data.trainer && <Trainer page/>}
  → Trainer (server): renderTrainer() → HTML для q/why/options (KaTeX, GFM) + id завдань
  → TrainerLoader (client, ssr:false) → Quiz UI
  → session.ts (reducer) ← дії UI; storage.ts ↔ localStorage (zod-валідація, version)
```

### 3.5 Перевірки

| Де                         | Що                                                                                                                                                                                                               | Коли                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Zod у `frontmatter.ts`     | склад і оформлення тренажера; `practice.mdx` зобов'язаний мати `trainer`, інші — не можуть                                                                                                                       | `next build`, `npm run dev`, `check-content`    |
| `rehypeKatexStrict`        | формули в MDX і в текстах завдань (усі помилки разом, не лише перша — F20)                                                                                                                                       | ті самі                                         |
| `scripts/check-content.ts` | усе вище за 1–3 с без Next + структура теорії (H2-розділи), унікальність slug тем, `practice.mdx` без `index.mdx`, існування сторінок із `meta.json`, іконки lucide, словник («урок»), мінус/кома поза формулами | `npm run check`, hook після правки контенту, CI |

### 3.6 Тести

- Unit поруч із модулем для всієї логіки `trainer/` (додати `storage.test.ts`, `verdict.test.ts`).
- E2E: список URL — із `sitemap.ts` (не з файлової системи, F33); прохід тренажера з правильними відповідями з frontmatter (F28); повтор помилок (F31); мобільний проєкт запускає схеми й тренажер (F34); layout чекає картку (F32); `@axe-core/playwright` для доступності тренажера й схем.

## 4. Логіка і представлення

| Компонент                              | Стан                                                                 | Що винести                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `Quiz.tsx` (199 рядків)                | змішує reducer, клавіатуру, фокус, збереження, розмітку              | `useTrainerKeyboard(cardRef, dispatch)`, `useTrainerProgress(key)`; клавіатура — у межах картки |
| `Results.tsx`                          | пороги вердикту у view                                               | `verdict(share, mode)` → `trainer/verdict.ts` з тестом                                          |
| `Feedback.tsx`                         | `answerHtml` (логіка форматування відповіді) у view                  | `answerText(step)` → `check.ts` з тестом                                                        |
| `ChoiceAnswer`, `MatchAnswer`          | власні `role=radio`/`aria-pressed` без клавіатурної моделі           | shadcn `RadioGroup` (Base UI) — патерн з коробки                                                |
| `page.tsx`                             | `pageTitle` з логікою регістру                                       | явний `title` у frontmatter                                                                     |
| `NumberSets.tsx`                       | дані (`SETS`, `EXAMPLES`) + неявна умова `sets[0]` = домашня множина | явне поле `home`, `PARENT`-мапа; дані можна винести у `number-sets.data.ts`                     |
| `session.ts`, `check.ts`, `storage.ts` | чисті                                                                | — (зразок)                                                                                      |

## 5. Бібліотеки

| Бібліотека                                                   | Вердикт                          | Коментар                                                                                                                                                                  |
| ------------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next 16 + Fumadocs 16 (`@fumadocs/base-ui` як `fumadocs-ui`) | лишити                           | документований спосіб установки Base UI-варіанта; дає все для сайту-довідника                                                                                             |
| React 19, Tailwind 4, shadcn (`base-nova`), `cn`             | лишити                           | `cn` — офіційний пакет shadcn (clsx + tailwind-merge); `shadcn` у dependencies потрібен лише для `shadcn/tailwind.css` — це нормально для стилю base-nova                 |
| Zod 4                                                        | лишити                           | потрібні `strictObject`, власні повідомлення, `z.locales.uk()` як запасний переклад                                                                                       |
| KaTeX 0.19 + override                                        | лишити                           | `rehype-katex` 7.0.1 досі тягне `^0.16` — override виправданий                                                                                                            |
| Orama (пошук Fumadocs)                                       | лишити                           | без українського стемінгу; пошук за початком слова працює. Динамічний маршрут `/api/search` — свідомий вибір: статичний індекс коштував би ~50 КБ gzip кожному, хто шукає |
| Vitest 5, Playwright 1.63                                    | лишити                           | додати `@axe-core/playwright`                                                                                                                                             |
| Mafs 0.21                                                    | додати з першою темою з графіком | React, підписи KaTeX, статичний рендер; для планіметрії — звичайний SVG у `figures/` (рукописний, AI пише його добре)                                                     |
| Mermaid                                                      | не додавати                      | 2+ МБ у клієнт і проблеми з темою; блок-схеми — `<Steps>` або SVG; за крайньої потреби `rehype-mermaid` під час збірки                                                    |
| `server-only`                                                | додати                           | 0 байт, захист меж сервер/клієнт                                                                                                                                          |
| TypeScript 7, ESLint 10                                      | не оновлювати                    | `typescript-eslint` ще не підтримує TS 7; ESLint 10 — лише разом із сумісним `eslint-config-next`                                                                         |

Хостинг: Vercel (нуль конфігурації для Next 16, прев'ю на кожну гілку, CI-статус видно в десктоп-застосунку). Статичний експорт можливий, але вимагає `staticGET` + клієнтський пошук і переписаного e2e — не вартий цього зараз.

## 6. Міграція (етап 1)

1. Перенести контент: `theory/number-sets.mdx` → `numbers/number-sets/index.mdx`, `practice/number-sets.mdx` → `numbers/number-sets/practice.mdx` (додати `title`, прибрати `<Trainer />`); решту теорій — у `numbers/<slug>/index.mdx`; `meta.json` розділу з порядком.
2. `src/content/frontmatter.ts`: `schema: ({ path }) => path.endsWith("/practice.mdx") ? practiceSchema : theorySchema`.
3. `page.tsx`: кнопка теорія↔практика за `topic.ts`; `{page.data.trainer && <Trainer page={page} />}` після MDX.
4. Видалити `topics.ts`, `topics.test.ts`, плагін дерева (лишити `lucideIconsPlugin`).
5. `storage.ts`: ключ `trainer:<slug>`; одноразове читання старого ключа `trainer:practice/<slug>` як fallback (не обов'язково — сайт ще не опубліковано).
6. `e2e/content.ts` → читати `sitemap.ts`/`source.getPages()`; оновити очікувані URL.
7. AGENTS.md, README, `.claude/skills/practice` — нові шляхи й правила (без `<Trainer />`, без «назва = назва теорії»).

Ризики: зміна URL і ключа прогресу (прийнятно до публікації); меню стає трирівневим — перевірити на телефоні.
