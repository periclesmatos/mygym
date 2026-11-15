/** Vibra se o aparelho permitir; nunca lança. */
export function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* sem vibração */
  }
}
