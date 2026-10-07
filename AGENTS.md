# AGENTS.md

Особистий сайт для підготовки до НМТ: теорія і практика за предметами й темами (зараз — математика, далі геометрія, хімія, фізика). Користувач вчиться з рівня шкільної програми й сам дає матеріал по темах; сайт не прив'язаний до конкретних підручників. Повний опис можливостей — у [README.md](README.md). Правила для контенту, тренажера й тестів — у `.claude/rules/` (підвантажуються за шляхами).

## Мова і стиль

- Вміст сайту, коментарі в коді, повідомлення про помилки, тексти тестів — **українською**. Ідентифікатори в коді, назви файлів і папок — англійською.
- Коротко, без води: правило → приклад з розв'язком. Приклади важливіші за слова.
- Терміни: **предмет** (коренева папка `content/<предмет>/`, вкладка меню, свій профіль іспиту), **профіль іспиту** (формат тесту: літери, склад), **розділ** (папка програми, напр. «Числа»), **тема**, **теорія**, **практика** (сторінка з тренажером), **тренажер** (код), **завдання**, **правило** (тег завдання). Слів «урок» і «питання» у проєкті немає.

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
- `npm run check` — швидка перевірка (секунди): контент (`check:content`) + typecheck + lint + юніт-тести. **Запускати після кожної правки**; hook робить `check:content` для зміненого файлу сам.
- `npm run verify` — `check` + knip + format:check + build + test:e2e. **Запускати перед завершенням роботи.** Повне e2e-проходження всіх практик — лише в CI; локально — еталонний набір, а кожну практику проганяє Vitest (`practices.test.ts`).
- `npm run rules -- <предмет>` — склад тренажера, типи завдань і приклад кожного (з профілю іспиту предмета й реєстру; вставляє skill `/practice`).
- `npm run export` — увесь контент у `dist/content/` як JSON з id завдань + JSON Schema з Zod (заготовка під базу даних і адмінку).
- Окремо: `typecheck`, `lint` (разом із межами архітектури й іменами файлів), `knip` (мертві експорти, файли, залежності), `format`, `test` (Vitest), `build`, `test:e2e` (Playwright, потребує свіжого `build`; сервер на порту 3100).

## Структура

```
content/                          контент (MDX): предмет → розділ → тема (папка)
  index.mdx                       головна: картки предметів (<Subjects />)
  meta.json                       порядок предметів
  <предмет>/meta.json             { title, icon, root: true, exam: <профіль іспиту>, description, pages }
  <предмет>/index.mdx             огляд предмета «як вчитися»          → /<предмет>
  <предмет>/<розділ>/meta.json    назва розділу, іконка, порядок тем (pages)
  …/<тема>/index.mdx              теорія теми                          → /<предмет>/<розділ>/<тема>
  …/<тема>/practice.mdx           практика (тренажер у frontmatter)    → /<предмет>/<розділ>/<тема>/practice
  …/<тема>/<сторінка>.mdx         підсторінка великої теми (за потреби)
source.config.ts                  MDX-плагіни: формули зі спільного конвеєра (shared/lib/markdown), читабельні формули в пошуку
src/                              три рівні: app → features → shared
  app/                            рівень 1, лише маршрути Next: site (назва сайту), layout, [[...slug]]/page (увесь контент
                                  і сторінки предмета: subject-pages — змішаний тест, прогрес), api/search, error, not-found, global.css
  features/                       рівень 2, можливості; кожна — сегменти model/ hooks/ components/
    content/                      контент як дані — єдина можливість, що знає Fumadocs
      model/                      source (loader), frontmatter (схеми за файлом + рендер тренажера за профілем предмета),
                                  topic (угода про шлях теми — єдине місце), subject (предмети з meta.json), page-tree
                                  (меню: тема, предмет, тест і прогрес), practices (усі практики за предметом чи профілем)
      components/                 topic-switch, subjects (картки на головній), mdx-components (реєстр для MDX)
    trainer/                      тренажер — без Next і Fumadocs
      model/                      exam/ (profile — тип, nmt-math — профіль, registry), question/ (реєстр типів: base — контракт,
                                  choice, match, multi, short, registry — єдиний список; схеми — фабрики від профілю),
                                  schema (+ lint — евристики якості), session, order, number, progress (сховище, version 3),
                                  mixed (змішаний тест за профілем), overview (зведення прогресу), verdict, answer-text,
                                  render (лише для збирання: Markdown+KaTeX → HTML, рисунки)
      hooks/                      use-trainer-session, use-progress, use-progress-overview, use-trainer-keyboard, use-step-focus, use-mounted
      components/                 trainer (вхід для сторінки), trainer-card, answer-field + answer-registry (поле за типом),
                                  choice-answer, match-answer, multi-answer, short-answer, option-row, feedback, results,
                                  rule-bars, mixed-trainer, progress-overview, shared
    diagram/                      схеми для теорії, у сегментах підпапки за предметом: model/math/number-sets,
                                  components/math/number-sets (сервер, KaTeX) + number-sets-diagram (клієнт), hooks/use-delayed-clear
  shared/                         рівень 3, спільне без домену; про features не знає
    ui/                           shadcn — лише через `npx shadcn@latest add <name>`, руками не правити
    lib/                          markdown (Markdown+KaTeX → HTML, спільний конвеєр), math (KaTeX), latex-text (пошук), i18n, utils
    test/                         налаштування Vitest
e2e/                              Playwright-тести; e2e/content.ts знаходить усі сторінки й практики, e2e/answers.ts — відповідачі за типом
scripts/                          check-content (перевірка контенту без Next), print-rules (склад і типи для skill), export-content
                                  (контент → JSON + JSON Schema), hooks/after-edit
.claude/                          rules/ (правила за шляхами; subjects/<предмет>.md — правила предмета), skills/ (subject, theory,
                                  practice, review-topic), agents/math-checker, settings.json
```

## Розбивка коду

Три рівні видно з дерева: `app` (маршрути) → `features` (можливості) → `shared` (спільне без домену). Кожна можливість — папка в `src/features/` (`content`, `trainer`, `diagram`), усередині три сегменти; нова схема — це нові файли в підпапці предмета всередині сегментів `diagram`, а не нова папка:

| Сегмент       | Що там                                           | Чого там немає           | Тести                                             |
| ------------- | ------------------------------------------------ | ------------------------ | ------------------------------------------------- |
| `model/`      | типи, схеми, reducer, обчислення — чисті функції | React, Next, `window`    | Vitest у Node                                     |
| `hooks/`      | React-hooks: стан + ефекти, без розмітки         | JSX, Next, Fumadocs      | `// @vitest-environment jsdom` + `renderHook`     |
| `components/` | розмітка: props → JSX; стан лише через hooks     | `localStorage`, Fumadocs | RTL там, де є умовна логіка; решту покривають e2e |

Правила, які перевіряє `npm run lint` (`eslint-plugin-boundaries`, конфіг — `eslint.config.mjs`):

1. Залежності лише вниз: `app` → `features` → `shared`. `shared` ніколи не імпортує з `features` чи `app`. Усередині можливості: `components` → `hooks` → `model`.
2. Між можливостями імпортів немає, крім двох: `content/model` → `trainer/model` (схема frontmatter перевіряє тренажер) і `content/components` → `components` будь-якої можливості (реєстр MDX).
3. `next/*` і `fumadocs-*` знають лише `app` і `content` (`shared/lib` — лише типи, для підписів i18n). У `model/` немає `react`.
4. `model/render.ts` — лише для збирання: його імпортує тільки `content/model/frontmatter.ts`. Модулі Node (`node:fs`, `node:path`) — лише в `content/model`.
5. Файл у `src/` поза `app/`, `features/<можливість>/<сегмент>/` чи `shared/{ui,lib,test}/` — помилка `no-unknown-files`. Потрібне нове правило — міняй конфіг, не обходь.
6. Файли — kebab-case (перевіряє лінт); компонент експортується PascalCase (`trainer-card.tsx` → `TrainerCard`). Barrel-файлів `index.ts` немає — імпорти прямі.
7. `knip` у `verify`: мертві експорти, файли й залежності — помилка. Не експортуй «про запас».
8. `scripts/` (перевірка контенту, hooks) імпортує лише `model` і `lib` — без React і Next. `e2e/` з `src` бере лише типи (`import type`): тести не виконують код сайту.

## Як додати

- **Предмет:** skill `/subject <slug> "<Назва>" <профіль>`: `content/<slug>/meta.json` з `root: true` і `exam`, `index.mdx` (огляд), slug у `content/meta.json`, правила предмета `.claude/rules/subjects/<slug>.md`; новий іспит — профіль у `src/features/trainer/model/exam/` + реєстр. Вкладка меню, змішаний тест і прогрес зʼявляються самі.
- **Тему:** skill `/theory <предмет>/<розділ>/<slug>` (матеріал — файлом або текстом). Руками: папка `content/<предмет>/<розділ>/<slug>/` з `index.mdx` (`title`, `description`) + slug у `pages` файлу `content/<предмет>/<розділ>/meta.json` у потрібне місце (порядок вивчення). Без цього тема все одно з'явиться (через `"..."`), але в кінці списку. Велику тему ділити на підсторінки в тій самій папці (порядок — `meta.json` теми: `["...", "practice"]`).
- **Розділ:** папка `content/<предмет>/<розділ>/` з `meta.json` (`title`, `icon` з lucide, `pages`) + slug у `pages` файлу `content/<предмет>/meta.json`.
- **Практику:** тільки skill `/practice <предмет>/<slug>`. Файл `practice.mdx` поруч з `index.mdx` — лише frontmatter, без тексту (практика це тільки тренажер, правила — в теорії; текст у тілі зупиняє збирання); тренажер, пункт меню «Практика», кнопки переходу й тести з'являються самі.
- **Схему для теорії:** підпапка предмета в сегментах `src/features/diagram/` + реєстрація в `src/features/content/components/mdx-components.tsx` + e2e-тест (див. «Схеми й ілюстрації»).
- **Компонент shadcn:** `npx shadcn@latest add <name>`.
- **Тип завдання тренажера:** модуль у `question/` + компонент + рядок у трьох реєстрах (модель, компоненти, e2e-відповідачі) — покроково в `.claude/rules/trainer.md`.
- **Ревʼю теми без змін:** skill `/review-topic <предмет>/<slug>`.

## Архітектурні рішення

- **Предмети** — кореневі папки контенту: `meta.json` з `root: true` дає вкладку предмета в меню Fumadocs, `exam` звʼязує з профілем іспиту (`content/model/subject.ts`). Змішаний тест збирається за профілем (усі предмети одного іспиту), прогрес і адреси — за предметом. Назва сайту — `src/app/site.ts`, предметів у ній немає.
- **Меню** (`src/features/content/model/page-tree.ts`): назва теми лише розгортає її, усередині — «Теорія», «Практика» й підсторінки; тема без практики — звичайний пункт; предмет лишається папкою з оглядом, у кінці його меню — «Змішаний тест» і «Прогрес» (`/<предмет>/test`, `/<предмет>/progress` — той самий catch-all маршрут, `app/[[...slug]]/subject-pages.tsx`: окремий маршрут давав 404 на prefetch посилань з меню). Футер «‹ ›» бере повні назви сторінок (`page.tsx`), бо в дереві вони короткі.
- **Угода про шлях теми** — лише `src/features/content/model/topic.ts` (`topicPage`, `topicId`, `urlOf`, `isPracticeUrl`…): схема frontmatter, меню, `check-content`, e2e і юніт-прогін беруть її звідти. Нова глибина чи інший файл практики — зміна в одному місці.
- **Тренажер показує сторінка сама**, якщо у frontmatter є `trainer` (`src/app/[[...slug]]/page.tsx`). У MDX нічого вставляти не треба.
- **Перевірки під час збирання** (повідомлення — українською, з місцем помилки):
  - схема frontmatter залежить від файлу: `practice.mdx` зобов'язаний мати `trainer` за профілем іспиту свого предмета і не може мати тексту під frontmatter, решта сторінок — не можуть мати `trainer`; `meta.json` предмета — `root: true` і `exam` з реєстру;
  - склад і оформлення тренажера — схема в `src/features/trainer/model/schema.ts` і `question/*.ts` (Zod з українськими повідомленнями: `z.locales.uk()`, `strictObject` — незнайоме поле це помилка);
  - зламана формула в MDX чи в тексті тренажера — `rehypeKatexStrict` (сам `rehype-katex` лише малює червоний текст і збирання не зупиняє);
  - варіант, пункт відповідності чи назва правила не в один рядок — `md.inline`; рисунок, якого немає, — `frontmatter.ts`;
  - евристики якості завдань — загальні в `src/features/trainer/model/lint.ts`, залежні від типу — метод `lint` модуля (`error` зупиняє збирання, `warn` показує лише `npm run check`).
- **Пошук** — вбудований Orama Fumadocs (`/api/search`), багатомовний. Формули в індексі — текстом через `latexToText`. Тексти завдань з frontmatter не індексуються.
- **Помилка під час показу сторінки** — `src/app/error.tsx` (меню лишається), а не порожній екран.
- Підписи інтерфейсу Fumadocs — у `src/shared/lib/i18n.ts`; новий рядок інтерфейсу без перекладу — додати туди.
- Тренажер (профілі іспитів, реєстр типів, формули, прогрес, клавіатура, змішаний тест) — `.claude/rules/trainer.md`.

## Інструменти Claude Code

- **Skills:** `/subject <slug> "<Назва>" <профіль>` — новий предмет; `/theory <предмет>/<розділ>/<slug>` — теорія теми з матеріалу; `/practice <предмет>/<slug>` — тренажер; `/review-topic <предмет>/<slug>` — ревʼю без змін. Процедура, шаблон і чек-лист — у `.claude/skills/*/`.
- **Агент `math-checker`** — незалежний перерахунок математики у файлі; викликати після кожної зміни контенту, перед `verify`.
- **Правила за шляхами** — `.claude/rules/content.md` (формат теорії, формули, схеми), `trainer.md` (тренажер), `tests.md`, `subjects/<предмет>.md` (програма іспиту, позначення, пастки предмета — підвантажуються для `content/<предмет>/**`).
- **Hooks** (`.claude/settings.json`): після Edit/Write — `check-content` для контенту, prettier для коду; помилки видно одразу. Дозволи на команди проєкту видано наперед; `src/shared/ui/**` правити заборонено; `--force`, `--legacy-peer-deps`, `git push --force` — заборонено.
- **CI:** `.github/workflows/verify.yml` ганяє `npm run verify` на push у `main` і на PR.

## Definition of Done

- `npm run verify` зелений; для контенту — ще й `math-checker` без зауважень; `npm run export` проходить (контент парситься повністю).
- Вигляд перевірено у вбудованому браузері (світла/темна тема, телефон), не лише збиранням.
- AGENTS.md, README, rules і skills оновлено, якщо змінилась структура чи правило.
- Коміт — лише коли власник просить; повідомлення українською, що і чому.

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
