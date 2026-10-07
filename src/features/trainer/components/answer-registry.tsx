import type { Question } from "../model/question/registry"
import { ChoiceAnswer } from "./choice-answer"
import { MatchAnswer } from "./match-answer"
import { MultiAnswer } from "./multi-answer"
import type { AnswerComponent } from "./shared"
import { ShortAnswer } from "./short-answer"

/**
 * Поле відповіді для кожного типу завдання з реєстру моделей (`question/registry.ts`).
 * Новий тип без компонента або з неправильними пропсами — помилка компіляції тут.
 */
export const ANSWER_COMPONENTS = {
  choice: ChoiceAnswer,
  match: MatchAnswer,
  multi: MultiAnswer,
  short: ShortAnswer,
} satisfies { [T in Question["type"]]: AnswerComponent<T> }
