# AGENTS.md

Особистий сайт для підготовки до НМТ з математики за посібниками «Алгебра» і «Геометрія». Користувач вчиться з рівня шкільної програми.

## Стек

- **Astro 7 + Starlight** — сайт, меню, пошук, світла/темна тема.
- **KaTeX** — формули: `remark-math` + `rehype-katex` через процесор `unified` з `@astrojs/markdown-remark` (типовий для Astro 7 Sätteri має KaTeX лише через сторонній плагін).
- **React 19 + shadcn/ui** (стиль `base-nova`, примітиви Base UI) + **Tailwind v4** — лише для тренажерів.
- **Zod-схеми** в content collections, **Vitest**, ESLint, Prettier.

Перш ніж писати код для Astro/Starlight/shadcn — звір з актуальною документацією через MCP `astro-docs` і `shadcn` (`.mcp.json`). Пам'ять моделі може бути застарілою: Astro 7 вийшов у червні 2026.

## Команди

- `npm run dev` — сайт на http://localhost:4321. Агенту: `npx astro dev --background`, далі `npx astro dev stop | status | logs`.
- `npm run verify` — check + lint + test + build. **Запускати перед завершенням роботи.**
- Окремо: `npm run check` (типи + схеми контенту), `lint`, `test`, `build`, `format`.

## Структура

```
src/content/docs/
  index.mdx                                 головна: як вчитися + автоматичний зміст
  materials.mdx                             підручники, посилання
  topics/<book>/NN-slug.md                  конспект ЗА ПІДРУЧНИКОМ (NN = номер теми в книзі)
  lessons/<book>/NN-slug/<name>.md          ВЛАСНИЙ урок — лише там, де складно
  lessons/<book>/NN-slug/<name>-trainer.mdx тренажер до уроку <name>
src/navigation.ts            реєстр тем для меню й змісту
src/assets/materials/        фото, скріни
src/lib/quiz/                схема й правила (schema.ts), перевірка, сесія, рендер формул; тести *.test.ts поруч
src/lib/content.ts           угоди про шляхи сторінок і зв'язки між ними
src/components/trainer/      UI тренажера (React)
src/components/ui/           shadcn — лише через `npx shadcn@latest add <name>`, руками не правити
src/components/overrides/    перевизначення Starlight (PageTitle: автопосилання)
```

`<book>` — `algebra` або `geometry`. Посилання конспект ↔ урок ↔ тренажер, меню й зміст на головній будуються **автоматично зі шляху** — вручну не прописувати.

## Як додати

- **Тему:** `topics/<book>/NN-slug.md` + рядок у `books` у `src/navigation.ts`.
- **Урок:** `lessons/<book>/NN-slug/<name>.md` з `sidebar: { label, order }` (order — порядок вивчення).
- **Тренажер:** тільки skill `/lesson-trainer <шлях до уроку .md>`.
- **Компонент shadcn:** `npx shadcn@latest add <name>`.

## Формати

**Конспект** (зразок `topics/algebra/01-numbers.md`): стисла теорія (таблиці, правила) → приклади з розв'язком → пастки в `:::caution[Пастка]` → «✅ Міні-тест» з відповідями в `<details>`.

**Урок** (зразок `lessons/algebra/01-numbers/number-sets.md`): простими словами: звідки взялося → схема чи аналогія (`:::tip`) → алгоритм → таблиця прикладів → типові помилки (`:::caution`) → вправи з відповідями в `<details>`.

## Формули й Markdown

- Inline `$...$`, блок `$$...$$` з порожніми рядками навколо.
- Множини — макроси `\N \Z \Q \I \R` (жирні, як у підручнику; `src/lib/math.ts`).
- Десяткова кома у формулі — `0{,}25`; поза формулами — `0,25`. Списки чисел з дробами — через `;`.
- Мінус у формулі — звичайний `-`; у тексті поза формулами — `−`.
- У таблицях модуль — `\lvert x \rvert`: символ `|` ламає таблицю.
- `.md` — для тексту; `.mdx` — лише коли потрібні компоненти (у MDX `{` і `<` поза формулами — це JSX).

## Правила

- Кожну числову відповідь і приклад перевіряй обчисленням (`python3` / `node`), перш ніж записати.
- Зміни у вигляді перевіряй у браузері, а не лише збиранням.
- Нові залежності — лише за потреби, актуальні стабільні версії, сумісність перевіряй, а не обходь (`--force`, `--legacy-peer-deps` — ні).
- Не створюй файли «про запас»: порожні уроки, тренажери без запиту.
