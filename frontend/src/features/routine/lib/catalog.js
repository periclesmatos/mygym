import { localKey } from '@/features/routine/lib/exerciseModel'
import { exerciseGroup, normalizeText } from '@/shared/lib/muscles'

const LIMIT = 60

/** Guarda nome e apelidos já normalizados em cada item, para a busca não refazer isso a cada tecla. */
export function prepareCatalog(items) {
  return items.map((item) => ({
    ...item,
    terms: [item.name, ...(item.aliases || [])].map(normalizeText).filter(Boolean)
  }))
}

/** Quão bem um texto (já normalizado) casa com a busca; menor é melhor, null é não casa. */
function rank(term, query, tokens) {
  if (term === query) return 0
  if (term.startsWith(query)) return 1
  const words = term.split(' ')
  if (tokens.every((token) => words.some((word) => word.startsWith(token)))) return 2
  if (term.includes(query)) return 3
  return null
}

/**
 * Busca sem acento nem caixa, por pedaços de palavra: "sup inc" acha "Supino Inclinado".
 * Nome conta mais que apelido; no empate, vêm antes os que o usuário já fez.
 * Sem busca, lista o grupo escolhido (ou tudo), com os já feitos primeiro.
 */
export function searchCatalog(items, query, { group = '', used = new Set() } = {}) {
  const text = normalizeText(query)
  const tokens = text ? text.split(' ') : []
  const results = []
  for (const item of items) {
    if (group && item.muscleGroup !== group) continue
    let score = 0
    if (text) {
      score = null
      item.terms.forEach((term, index) => {
        const value = rank(term, text, tokens)
        if (value == null) return
        const weighted = value + (index === 0 ? 0 : 0.5)
        if (score == null || weighted < score) score = weighted
      })
      if (score == null) continue
    }
    results.push({ item, score, used: used.has(normalizeText(item.name)) })
  }
  results.sort(
    (a, b) => a.score - b.score || Number(b.used) - Number(a.used) || a.item.name.localeCompare(b.item.name, 'pt-BR')
  )
  return results.slice(0, LIMIT).map((result) => result.item)
}

/** Item do catálogo com esse nome ou apelido exato. */
export function findInCatalog(items, name) {
  const text = normalizeText(name)
  if (!text) return null
  return items.find((item) => item.terms.includes(text)) || null
}

/** Como o usuário já configurou cada exercício nas rotinas, por nome normalizado. */
export function previousConfigs(templates) {
  const map = new Map()
  for (const template of templates || []) {
    for (const exercise of template.exercises || []) {
      const key = normalizeText(exercise.name)
      if (key && !map.has(key)) map.set(key, exercise)
    }
  }
  return map
}

/** Rascunho de exercício a partir do catálogo: usa o que o usuário já fez antes, senão a sugestão. */
export function draftFromCatalog(item, previous) {
  const before = previous?.get(normalizeText(item.name))
  const source = before || item
  return {
    key: localKey(),
    name: item.name,
    plannedSets: String(source.plannedSets),
    reps: source.reps,
    load: before?.load == null ? '' : String(before.load),
    restSeconds: String(source.restSeconds),
    rir: before?.rir == null ? '' : String(before.rir),
    muscleGroup: item.muscleGroup || exerciseGroup(before) || ''
  }
}
