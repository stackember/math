---
paths:
  - "src/features/trainer/**"
  - "content/**/practice.mdx"
  - ".claude/skills/practice/**"
  - ".claude/skills/subject/**"
---

# Тренажер

Профіль іспиту, реєстр типів завдань, конвеєр формул, прогрес — рішення, які не видно з коду одразу.

- **Профіль іспиту** — `src/features/trainer/model/exam/<профіль>.ts` + реєстр `exam/registry.ts` (тип `ExamProfile` у `exam/profile.ts`): літери й кількість варіантів, форма відповідності, поля короткої відповіді, межі `multi`, склад практики (`composition`, ліміти за типом — ключ `type` з реєстру, тип без запису не обмежується), склад змішаного тесту (`mixed`), рівні. Предмет указує профіль у `content/<предмет>/meta.json` → `exam`; схеми типів, `trainerSchema` і `composeMixed` отримують профіль параметром — один реєстр типів обслуговує всі іспити. Назва сайту — `src/app/site.ts`, не тут.
- **Формули завдань рендеряться під час збирання у схемі frontmatter** (`trainerSchema.transform(renderTrainer)` у `src/features/content/model/frontmatter.ts`): у `page.data.trainer` уже HTML, KaTeX у браузер не потрапляє, а тренажер не має серверного коду.
- **Один конвеєр Markdown** — `src/shared/lib/markdown.ts`: ті самі плагіни (GFM, `remark-math`, KaTeX суворий) для сторінок MDX (`source.config.ts`) і текстів тренажера. Умова `q` і пояснення `why` — будь-який Markdown (абзаци, `$$…$$`, таблиці); варіанти, пункти відповідності й назви правил — один рядок (`md.inline`). Рисунок до завдання — `figure: { src, alt }`: файл з папки теми вбудовується в HTML даними під час збирання.
- **Типи завдань — реєстр** (`src/features/trainer/model/question/registry.ts`): один список `QUESTION_MODULES`, з нього виводяться схема, типи `Question`/`Draft` і повідомлення про невідомий `type`. Reducer сесії, картка, клавіатура, результати, схема складу, `check` і e2e конкретних типів не знають — усе через `moduleOf(question)` (контракт `QuestionModule` у `question/base.ts`: рендер, порядок показу, чернетка, перевірка, відповідь на бланку, еталонні чернетки `correctDraft`/`wrongDraft`, клавіша-цифра `digit`, евристики `lint`, довідка `meta`). У інтерфейсі тип стирається в одному місці — `components/answer-field.tsx`; компонент береться з `components/answer-registry.tsx`.
- **Картка тренажера монтується після гідрації** (`useMounted`): порядок завдань випадковий, результати — з `localStorage`; до монтування сервер і браузер показують однакову заглушку. `next/dynamic` не потрібен.
- **Клавіатура тренажера** (`use-trainer-keyboard`): Enter і цифри працюють, коли фокус у картці або просто на сторінці; меню, пошук, кнопки й поля поза карткою не зачіпає; автоповтор і Cmd/Ctrl/Alt ігнорує. Що означає цифра — вирішує модуль типу (`digit`): у `choice` обирає, у `multi` перемикає, інші її не використовують.
- **Прогрес** — за інтерфейсом `ProgressStore` (`src/features/trainer/model/progress.ts`); реалізація — localStorage з ключем `trainer:<предмет>/<slug теми>` (без розділу: переміщення теми між розділами предмета не стирає прогрес; slug після публікації не змінювати). Формат `version: 3`: найкращий і останній результат, накопичені правильно/усього за правилами теми й історія останніх проходів з часом (`attempts`, не більше `ATTEMPTS_KEPT`); старі записи (без версії, версія 2) і ключі до появи предметів (`trainer:<slug>`, `trainer:practice/<slug>`, `trainer:mixed` → математика) читаються й мігрують у `migrate`/`legacyKeys` — історії в них немає.
- **Змішаний тест** (`/<предмет>/test`, `src/app/[subject]/test/page.tsx`) — `model/mixed.ts`: з практик усіх предметів того самого профілю іспиту (`practiceSources({ exam })`, у порядку меню) складається набір за `profile.mixed` (склад іспиту за типами, порівну з тем, типи поза складом не беруться). Завдання лишає `index` з практики й отримує `topic` (id теми `<предмет>/<slug>`), тег стає глобальним `<id теми>/<tag>` — так результати за правилами підписані темою, а прогрес під ключем `trainer:mixed/<профіль>` не плутає теми. Картка несе `data-topic` і `data-question` для e2e.
- **Сторінка прогресу** (`/<предмет>/progress`, `src/app/[subject]/progress/page.tsx`) — `model/overview.ts`: теми предмета з контенту, записи зі сховища (тема + змішаний тест профілю за глобальними тегами), слабкі правила. Читається після монтування (`useProgressOverview`), бо localStorage є лише в браузері. Обидві сторінки додаються в кінець меню кожного предмета в `content/model/page-tree.ts`.
- **Довідка про типи — з коду:** `npm run rules -- <предмет>` друкує склад профілю, таблицю типів з параметрами профілю і YAML-приклад кожного (`meta` модулів); skill `/practice` вставляє цей вивід. Приклад у `meta.example` перевіряється тестом за профілем за замовчуванням — довідка не може розійтися з кодом.
- **Стабільні id завдань:** у frontmatter можна дати `id` (kebab-case, унікальний у практиці); `npm run export` пише контент у JSON з id (явним або `<предмет>/<тема>/<індекс>`) і JSON Schema з Zod — заготовка під базу даних. У браузері завдання ідентифікується `index` (позиція у практиці).

## Як додати тип завдання

1. `src/features/trainer/model/question/<type>.ts` — фабрика схеми `schema(profile)` (`strictObject`, повідомлення українською, межі з профілю) і обʼєкт `satisfies QuestionModule<typeof schema, <Type>Draft>`: `type`, `schema`, `meta` (label, answerHint без чисел, example), рендер власних текстів, `displayOrder`, чернетка, `isAnswered`/`invalidReason`/`isCorrect`, `answerHtml(question, order, profile)`, `correctDraft`/`wrongDraft`; за потреби `digit` і `lint` (для варіантів, що перемішуються, — `positionalOptionProblems` з `base.ts`). Юніт-тест у `registry.test.ts`: схема, перевірка, відповідь при перемішаному порядку, цифра.
2. Рядок у `QUESTION_MODULES` (`question/registry.ts`).
3. `src/features/trainer/components/<type>-answer.tsx` з пропсами `AnswerProps<"<type>">` (`components/shared.tsx`; для рядків А–Д — `option-row.tsx`) + рядок у `components/answer-registry.tsx`. Контракт з e2e: `data-answer`, `data-option`, `data-mark`.
4. Рядок у `e2e/answers.ts` (як відповісти правильно й неправильно в браузері) + один e2e-сценарій особливої поведінки типу в `e2e/trainer.spec.ts`.
5. Якщо тип треба обмежити у складі або включити в змішаний тест — записи в `composition.types` і `mixed` профілів іспитів.
6. README → «Типи завдань» (і «Гарячі клавіші», якщо є); `.claude/agents/math-checker.md`, якщо відповідь нової форми треба перевіряти інакше.

Пропуск кроків 1–4 — помилка компіляції (`satisfies` у реєстрах). Reducer, картка, результати, схема складу, `check`, юніт-прогін практик (`src/features/content/model/practices.test.ts`) і повне e2e-проходження лишаються без змін.

## Практика в контенті

- `content/<розділ>/<тема>/practice.mdx` — лише frontmatter (`title: "Практика: …"`, `description`, `trainer`), без тексту під ним: практика це тільки тренажер, правила — в теорії. Текст у тілі зупиняє збирання.
- Правила YAML і текстів — `.claude/skills/practice/reference.md`; склад, типи й приклад кожного типу — `npm run rules` (з `exam.ts` і реєстру).
- `multi` (кілька правильних) — у НМТ з математики такого типу немає: лише для правил з кількома прикладами й контрприкладами, не більше ліміту зі складу; умова має казати «обери всі» (інакше `npm run check` попередить).
- Slug теми після публікації не змінювати: ключ прогресу `trainer:<предмет>/<slug>`.
