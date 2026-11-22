/**
 * A escada pronta para desenhar, do topo para a base.
 *
 * Cada rank sabe se já passou, se é o atual ou quanto falta; cada divisão, quanto da barra encher.
 */
export function ladderTiers(ladder, { rank, points, progress }) {
  const groups = new Map()
  for (const step of ladder) groups.set(step.key, [...(groups.get(step.key) || []), step])
  return [...groups.values()].reverse().map((steps) => {
    const current = steps.some((step) => step.index === rank.index)
    const passed = !current && steps[0].index < rank.index
    return {
      key: steps[0].key,
      name: steps[0].name,
      state: current ? 'current' : passed ? 'passed' : 'ahead',
      missing: current || passed ? 0 : Math.max(0, steps[0].floor - points),
      steps: steps.map((step) => ({
        ...step,
        active: step.index === rank.index,
        fill: step.index < rank.index ? 1 : step.index === rank.index ? Math.min(1, Math.max(0, progress)) : 0
      }))
    }
  })
}
