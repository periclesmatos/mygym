import { readJson, removeItem, writeJson } from '@/shared/lib/storage'

// O descanso fica salvo para sobreviver a um recarregamento da página.
const REST_KEY = 'appgym_rest'

/** Descanso em andamento desta sessão, ou null se não houver ou já tiver acabado. */
export function readRest(sessionId) {
  const rest = readJson(REST_KEY)
  return rest && rest.sessionId === sessionId && rest.endsAt > Date.now() ? rest : null
}

export function writeRest(rest) {
  if (rest) writeJson(REST_KEY, rest)
  else removeItem(REST_KEY)
}
