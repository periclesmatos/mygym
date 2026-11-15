import { exerciseGroup, normalizeText } from '@/features/catalog'
import { localKey } from '@/features/routine/domain/exerciseModel'

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
