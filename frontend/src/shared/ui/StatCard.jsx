import { Icon } from '@/shared/ui/Icon'

/** Número em destaque com ícone e legenda; vai dentro de `.stats`. */
export function StatCard({ icon, value, label }) {
  return (
    <div className="stat">
      <Icon name={icon} size={20} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}
