/** Identifica um envio; crypto.randomUUID só existe em HTTPS/localhost. */
export function localRequestKey() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}
