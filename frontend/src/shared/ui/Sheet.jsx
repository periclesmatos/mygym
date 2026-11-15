import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

let openCount = 0

export function Sheet({ open, onClose, title, subtitle, children, footer }) {
  const titleId = useId()
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    openCount += 1
    document.body.classList.add('no-scroll')
    const previous = document.activeElement
    const onKey = (event) => {
      if (event.key === 'Escape') closeRef.current?.()
    }
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => {
      const target = panelRef.current?.querySelector('[data-autofocus]') || panelRef.current
      target?.focus({ preventScroll: true })
    })
    return () => {
      window.removeEventListener('keydown', onKey)
      openCount -= 1
      if (openCount === 0) document.body.classList.remove('no-scroll')
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="sheet-grip" aria-hidden="true" />
        {title && (
          <header className="sheet-head">
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p className="muted">{subtitle}</p>}
          </header>
        )}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

/** Lista de ações dentro de uma folha. */
export function ActionList({ children }) {
  return <div className="action-list">{children}</div>
}

export function Action({ icon: IconEl, label, hint, danger, onClick, disabled }) {
  return (
    <button type="button" className={`action ${danger ? 'danger' : ''}`} onClick={onClick} disabled={disabled}>
      {IconEl}
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
    </button>
  )
}
