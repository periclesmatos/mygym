/** Grupos musculares como etiquetas; passa de `max` vira "+N". Usa span para caber dentro de links e botões. */
export function MuscleChips({ groups, max = 4, size }) {
  if (!groups?.length) return null
  const shown = groups.slice(0, max)
  const hidden = groups.length - shown.length
  return (
    <span className={size === 'lg' ? 'tags lg' : 'tags'} role="list" aria-label="Grupos musculares">
      {shown.map((group, index) => (
        <span key={group} role="listitem" className={index === 0 ? 'tag main' : 'tag'}>
          {group}
        </span>
      ))}
      {hidden > 0 && (
        <span role="listitem" className="tag more">
          +{hidden}
        </span>
      )}
    </span>
  )
}
