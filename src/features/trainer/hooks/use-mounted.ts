import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * `true` лише в браузері після гідрації. Серверний HTML і перший рендер у браузері
 * збігаються (обидва бачать `false`), тож компоненти з випадковим порядком чи localStorage
 * монтуються наступним рендером без помилки гідрації.
 */
export const useMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
