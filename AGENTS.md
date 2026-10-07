# AGENTS.md

Особистий сайт для підготовки до НМТ з математики: теорія і практика за темами. Користувач вчиться з рівня шкільної програми й сам дає матеріал по темах; сайт не прив'язаний до конкретних підручників. Повний опис можливостей — у [README.md](README.md).

## Мова і стиль

- Вміст сайту, коментарі в коді, повідомлення про помилки, тексти тестів — **українською**. Ідентифікатори в коді, назви файлів і папок — англійською.
- Коротко, без води: правило → приклад з розв'язком. Приклади важливіші за слова.
- Терміни: **розділ** (папка програми, напр. «Числа»), **тема**, **теорія**, **практика** (сторінка з тренажером), **тренажер** (код), **завдання**, **правило** (тег завдання). Слів «урок» і «питання» у проєкті немає.

## Стек

- **Next.js 16** (App Router, Turbopack) + **Fumadocs 16**: меню, пошук, зміст сторінки, світла/темна тема. UI Fumadocs — пакет `@fumadocs/base-ui` (встановлений під іменем `fumadocs-ui`).
- **fumadocs-mdx 15**: колекції через macro-виклик у `src/features/content/model/source.ts`, глобальні MDX-плагіни — у `source.config.ts`.
- **KaTeX 0.19** (`remark-math` + `rehype-katex` + наш `rehypeKatexStrict`).
- **React 19 + shadcn/ui** (стиль `base-nova`, примітиви Base UI) + **Tailwind 4**. Fumadocs бере кольори з тих самих токенів shadcn (`fumadocs-ui/css/shadcn.css`) — одна палітра.
- **Zod 4**, **TypeScript 6**, **Vitest** + **@testing-library/react** (jsdom), **Playwright**, ESLint (`eslint-config-next`, `eslint-plugin-boundaries`, `eslint-plugin-check-file`), **knip**, Prettier.

Перш ніж писати код під Next.js / Fumadocs / shadcn — звір з актуальною документацією. Пам'ять моделі може бути застарілою:

- Next.js: документація саме встановленої версії — `node_modules/next/dist/docs/`; MCP `next-devtools` (`.mcp.json`) дає помилки й маршрути запущеного `npm run dev`.
- Fumadocs: https://fumadocs.dev/docs і типи в `node_modules/fumadocs-*/dist`.
- shadcn: MCP `shadcn`.

## Команди

- `npm run dev` — сайт на http://localhost:3000.
- `npm run verify` — typecheck + lint + knip + format:check + test + build + test:e2e. **Запускати перед завершенням роботи.**
- Окремо: `typecheck`, `lint` (разом із межами архітектури й іменами файлів), `knip` (мертві експорти, файли, залежності), `format`, `test` (Vitest), `build`, `test:e2e` (Playwright, потребує свіжого `build`; сервер на порту 3100).

## Структура

```
content/                          контент (MDX): одна папка — одна тема
  index.mdx                       головна «Як вчитися»
  meta.json                       порядок розділів
  <розділ>/meta.json              назва розділу, іконка, порядок тем (pages)
  <розділ>/<тема>/index.mdx       теорія теми            → /<розділ>/<тема>
  <розділ>/<тема>/practice.mdx    практика (тренажер у frontmatter) → /<розділ>/<тема>/practice
  <розділ>/<тема>/<сторінка>.mdx  підсторінка великої теми (за потреби)
source.config.ts                  MDX-плагіни: формули зі спільного конвеєра (shared/lib/markdown), читабельні формули в пошуку
src/                              три рівні: app → features → shared
  app/                            рівень 1, лише маршрути Next: layout, [[...slug]]/page, api/search, error, not-found, global.css
  features/                       рівень 2, можливості; кожна — сегменти model/ hooks/ components/
    content/                      контент як дані — єдина можливість, що знає Fumadocs
      model/                      source (loader), frontmatter (схеми за іменем файлу + рендер тренажера), topic, page-tree
      components/                 topic-switch, mdx-components (реєстр компонентів для MDX)
    trainer/                      тренажер — без Next і Fumadocs
      model/                      exam (профіль іспиту), question/ (реєстр типів завдань: base, choice, match, short, registry),
                                  schema (+ lint — евристики якості), session, order, number, progress (сховище прогресу),
                                  verdict, answer-text, render (лише для збирання: Markdown+KaTeX → HTML, рисунки)
      hooks/                      use-trainer-session, use-progress, use-trainer-keyboard, use-step-focus, use-mounted
      components/                 trainer (вхід для сторінки), trainer-card, answer-field (поле за типом завдання),
                                  choice-answer, match-answer, short-answer, feedback, results, shared
    diagram/                      схеми для теорії, усі в одних сегментах: model/number-sets, hooks/use-delayed-clear,
                                  components/number-sets (сервер, KaTeX) + number-sets-diagram (клієнт)
  shared/                         рівень 3, спільне без домену; про features не знає
    ui/                           shadcn — лише через `npx shadcn@latest add <name>`, руками не правити
    lib/                          markdown (Markdown+KaTeX → HTML, спільний конвеєр), math (KaTeX), latex-text (пошук), i18n, utils
    test/                         налаштування Vitest
e2e/                              Playwright-тести; e2e/content.ts знаходить усі сторінки й практики
```

## Розбивка коду

Три рівні видно з дерева: `app` (маршрути) → `features` (можливості) → `shared` (спільне без домену). Кожна можливість — папка в `src/features/` (`content`, `trainer`, `diagram`), усередині три сегменти; нова схема — це нові файли в сегментах `diagram`, а не нова папка:

| Сегмент       | Що там                                           | Чого там немає           | Тести                                             |
| ------------- | ------------------------------------------------ | ------------------------ | ------------------------------------------------- |
| `model/`      | типи, схеми, reducer, обчислення — чисті функції | React, Next, `window`    | Vitest у Node                                     |
| `hooks/`      | React-hooks: стан + ефекти, без розмітки         | JSX, Next, Fumadocs      | `// @vitest-environment jsdom` + `renderHook`     |
| `components/` | розмітка: props → JSX; стан лише через hooks     | `localStorage`, Fumadocs | RTL там, де є умовна логіка; решту покривають e2e |

Правила, які перевіряє `npm run lint` (`eslint-plugin-boundaries`, конфіг — `eslint.config.mjs`):

1. Залежності лише вниз: `app` → `features` → `shared`. `shared` ніколи не імпортує з `features` чи `app`. Усередині можливості: `components` → `hooks` → `model`.
2. Між можливостями імпортів немає, крім двох: `content/model` → `trainer/model` (схема frontmatter перевіряє тренажер) і `content/components` → `components` будь-якої можливості (реєстр MDX).
3. `next/*` і `fumadocs-*` знають лише `app` і `content`. У `model/` немає `react`.
4. `model/render.ts` — лише для збирання: його імпортує тільки `content/model/frontmatter.ts`. Модулі Node (`node:fs`, `node:path`) — лише в `content/model`.
5. Файл у `src/` поза `app/`, `features/<можливість>/<сегмент>/` чи `shared/{ui,lib,test}/` — помилка `no-unknown-files`. Потрібне нове правило — міняй конфіг, не обходь.
6. Файли — kebab-case (перевіряє лінт); компонент експортується PascalCase (`trainer-card.tsx` → `TrainerCard`). Barrel-файлів `index.ts` немає — імпорти прямі.
7. `knip` у `verify`: мертві експорти, файли й залежності — помилка. Не експортуй «про запас».

## Як додати

- **Тему:** папка `content/<розділ>/<slug>/` з `index.mdx` (`title`, `description`) + slug у `pages` файлу `content/<розділ>/meta.json` у потрібне місце (порядок вивчення). Без цього тема все одно з'явиться (через `"..."`), але в кінці списку. Велику тему ділити на підсторінки в тій самій папці (порядок — `meta.json` теми: `["...", "practice"]`).
- **Розділ:** папка `content/<розділ>/` з `meta.json` (`title`, `icon` з lucide, `pages`) + slug у `content/meta.json`.
- **Практику:** тільки skill `/practice <slug>`. Файл `practice.mdx` поруч з `index.mdx`; тренажер, пункт меню «Практика», кнопки переходу й тести з'являються самі.
- **Тип завдання:** модуль `src/features/trainer/model/question/<type>.ts` — схема Zod (`strictObject`, повідомлення українською) і об'єкт `QuestionModule` (рендер власних текстів, порядок показу, чернетка, перевірка, відповідь на бланку) + рядок у `question/registry.ts` + компонент поля відповіді в `components/` + гілка в `components/answer-field.tsx`. TypeScript не дасть пропустити жоден крок; reducer, картка, результати й e2e лишаються без змін. Правило якості (як «варіант залежить від порядку») — запис у `model/lint.ts`.
- **Схему для теорії:** папка `src/features/diagram/` за сегментами + реєстрація в `src/features/content/components/mdx-components.tsx` + e2e-тест (див. «Схеми й ілюстрації»).
- **Компонент shadcn:** `npx shadcn@latest add <name>`.

## Формат теорії

Зразок — `content/numbers/number-sets/index.mdx`. Розділи:

1. `## Коротко` — правила, означення, таблиці.
2. `## Простими словами` — лише якщо тема цього потребує: звідки взялося, аналогія (`<Callout type="idea" title="Аналогія">`), алгоритм, схема.
3. `## Приклади` — з розв'язком.
4. `## Пастки` — типові помилки в `<Callout type="warn" title="Не плутай">`.

**Без тестів і вправ** у теорії: перевірка знань — лише в практиці.

## Формули й MDX

- Inline `$...$`, блок `$$...$$` з порожніми рядками навколо.
- Множини — макроси `\N \Z \Q \I \R` (жирні; `src/shared/lib/math.ts`).
- Десяткова кома у формулі — `0{,}25`; поза формулами — `0,25`. Списки чисел з дробами — через `;`.
- Мінус у формулі — звичайний `-`; у тексті поза формулами — `−`.
- У таблицях модуль — `\lvert x \rvert`: символ `|` ламає таблицю.
- У MDX `{`, `}` і `<` поза формулами й кодом — це JSX: не використовувати.
- Компоненти без імпорту: `Callout` (`type`: `idea`, `warn`, `info`, `success`, `error`), `Steps`/`Step`, `Cards`/`Card`, схеми (`<NumberSets />`). Новий компонент для MDX — реєструвати в `src/features/content/components/mdx-components.tsx`.
- Усередині `<Callout>` / `<Step>` — порожній рядок після відкриваючого й перед закриваючим тегом, інакше Markdown (списки) не розбереться.
- Prettier контент не форматує (`content/` у `.prettierignore`): він міняє лапки в YAML і ламає LaTeX.

## Схеми й ілюстрації

- Схема, що показує ідею теми (вкладеність, відстань, поділ), — своя папка `src/features/diagram/`: `model/` — дані без React, `components/` — серверна частина рендерить формули KaTeX, клієнтська (`"use client"`) — лише інтерактив. Кольори — Tailwind з `dark:`-варіантами, стан — у `data-*` атрибутах (на них спираються e2e-тести).
- Графіки функцій, координатна площина, геометрія — бібліотека Mafs (ставити, коли з'явиться перша така тема).
- Блок-схеми алгоритмів — Mermaid (так само — лише за потреби).

## Архітектурні рішення

- **Профіль іспиту** — `src/features/trainer/model/exam.ts`: назва сайту, літери варіантів, форма відповідності, склад тренажера, рівні. Усе, що залежить від формату НМТ, лише там.
- **Тренажер показує сторінка сама**, якщо у frontmatter є `trainer` (`src/app/[[...slug]]/page.tsx`). У MDX нічого вставляти не треба.
- **Формули завдань рендеряться під час збирання у схемі frontmatter** (`trainerSchema.transform(renderTrainer)` у `src/features/content/model/frontmatter.ts`): у `page.data.trainer` уже HTML, KaTeX у браузер не потрапляє, а тренажер не має серверного коду.
- **Один конвеєр Markdown** — `src/shared/lib/markdown.ts`: ті самі плагіни (GFM, `remark-math`, KaTeX суворий) для сторінок MDX (`source.config.ts`) і текстів тренажера. Умова `q` і пояснення `why` — будь-який Markdown (абзаци, `$$…$$`, таблиці); варіанти, пункти відповідності й назви правил — один рядок (`md.inline`). Рисунок до завдання — `figure: { src, alt }`: файл з папки теми вбудовується в HTML даними під час збирання.
- **Типи завдань — реєстр** (`src/features/trainer/model/question/registry.ts`): reducer сесії, картка й e2e не знають конкретних типів — усе через `moduleOf(question)` і `updateDraft`. Єдине місце, де тип розгалужується в інтерфейсі, — `components/answer-field.tsx`.
- **Картка тренажера монтується після гідрації** (`useMounted`): порядок завдань випадковий, результати — з `localStorage`; до монтування сервер і браузер показують однакову заглушку. `next/dynamic` не потрібен.
- **Клавіатура тренажера** (`use-trainer-keyboard`): Enter і цифри працюють, коли фокус у картці або просто на сторінці; меню, пошук, кнопки й поля поза карткою не зачіпає; автоповтор і Cmd/Ctrl/Alt ігнорує.
- **Перевірки під час збирання** (повідомлення — українською, з місцем помилки):
  - схема frontmatter залежить від імені файлу: `practice.mdx` зобов'язаний мати `trainer`, решта сторінок — не можуть;
  - склад і оформлення тренажера — схема в `src/features/trainer/model/schema.ts` і `question/*.ts` (Zod з українськими повідомленнями: `z.locales.uk()`, `strictObject` — незнайоме поле це помилка);
  - зламана формула в MDX чи в тексті тренажера — `rehypeKatexStrict` (сам `rehype-katex` лише малює червоний текст і збирання не зупиняє);
  - варіант, пункт відповідності чи назва правила не в один рядок — `md.inline`; рисунок, якого немає, — `frontmatter.ts`;
  - евристики якості завдань (варіант «усі перелічені» без `keepOrder`) — список правил у `src/features/trainer/model/lint.ts`.
- **Пошук** — вбудований Orama Fumadocs (`/api/search`), багатомовний. Формули в індексі — текстом через `latexToText`. Тексти завдань з frontmatter не індексуються.
- **Прогрес** — за інтерфейсом `ProgressStore` (`src/features/trainer/model/progress.ts`); реалізація — localStorage з ключем `trainer:<slug теми>` (без розділу: переміщення теми між розділами не стирає прогрес; slug після публікації не змінювати). Запис має `version`; старі записи (без версії, старий ключ `trainer:practice/<slug>`) читаються й мігрують у `migrate`. Зберігаються найкращий і останній результат і накопичені правильно/усього за правилами теми.
- **Помилка під час показу сторінки** — `src/app/error.tsx` (меню лишається), а не порожній екран.
- Підписи інтерфейсу Fumadocs — у `src/shared/lib/i18n.ts`; новий рядок інтерфейсу без перекладу — додати туди.

## Тести

- **Автоматично для нового контенту:** кожна сторінка з `content/` перевіряється на 200, помилки в консолі й червоні формули; кожна практика — повним проходженням (`e2e/content.ts` знаходить їх сам).
- **`model/`** — юніт-тести поруч із модулем, у Node. **`hooks/`** — `renderHook` з `@testing-library/react`, файл починається з `// @vitest-environment jsdom`. Компоненти з умовною логікою — RTL; решту покривають e2e.
- **Нова схема чи інтерактивний компонент** — e2e-тест у `e2e/` через `data-*` стани (зразок — `e2e/diagrams.spec.ts`).
- Локатори тренажера в e2e — у межах картки `[data-slot=card]`. Контракт з тестами — `data-*`: картка несе `data-question` (індекс завдання у frontmatter), поле відповіді — `data-answer` (тип), варіанти — `data-option` (індекс у frontmatter, незалежно від перемішування), рядки відповідності — `data-row`. `e2e/content.ts` читає frontmatter практики (`yaml`) і відповідає правильно — повне проходження перевіряє й перевірку відповідей.
- Кліки одразу після завантаження сторінки можуть потрапити до гідрації React: обгортати в `expect(...).toPass()` (зразок — пошук у `e2e/site.spec.ts`).

## Залежності

- Нові — лише за потреби, актуальні стабільні версії; сумісність перевіряй, а не обходь (`--force`, `--legacy-peer-deps` — ні).
- Оновлювати разом, однаковими версіями: `fumadocs-core`, `fumadocs-ui` (`npm:@fumadocs/base-ui@…`), `fumadocs-mdx` — точні версії; `next` і `eslint-config-next` — одна версія.
- KaTeX: у `package.json` → `overrides` примусово 0.19 для всього дерева (`rehype-katex` тягне 0.16 з відомою вразливістю). Прибрати override, коли `rehype-katex` сам перейде на ≥ 0.18.2.
- TypeScript 7 **не ставити**, доки `typescript-eslint` його не підтримує (зараз — до 6.0): лінтер падає.
- `npm audit`: лишається `braces` (high) — лише в інструментах розробки (ESLint, shadcn CLI), виправленої версії поки немає; на сайт не впливає.

## Правила

- Кожну числову відповідь і приклад перевіряй обчисленням (`python3` / `node`), перш ніж записати.
- Зміни у вигляді перевіряй у браузері (`npm run dev`) і e2e-тестами, а не лише збиранням.
- Не створюй файли «про запас»: порожні теми, практику без запиту, експорти без споживача.
