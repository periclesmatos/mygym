import { Icon } from '@/shared/ui/Icon'

export function Skeleton({ lines = 3, card = true }) {
  return (
    <div className={card ? 'card skeleton' : 'skeleton'} aria-busy="true" aria-label="Carregando">
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} style={{ width: `${index === 0 ? 55 : 90 - index * 12}%` }} />
      ))}
    </div>
  )
}

export function Empty({ icon = 'dumbbell', title, text, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={26} />
      </span>
      <strong>{title}</strong>
      {text && <p className="muted">{text}</p>}
      {children}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty">
      <strong>Não deu para carregar</strong>
      <p className="muted">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Tentar de novo
        </button>
      )}
    </div>
  )
}
