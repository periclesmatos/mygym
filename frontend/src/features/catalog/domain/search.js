import { normalizeText } from '@/features/catalog/domain/muscles'

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
