import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

const FeedbackContext = createContext(null)

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState(null)
  const seq = useRef(0)

  const toast = useCallback((message, tone = 'info') => {
    seq.current += 1
    const id = seq.current
    setToasts((current) => [...current.slice(-2), { id, message, tone }])
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), tone === 'error' ? 4500 : 2800)
  }, [])

  const confirm = useCallback((options) => new Promise((resolve) => setDialog({ ...options, resolve })), [])

  function close(result) {
    dialog?.resolve(result)
    setDialog(null)
  }

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm])

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast ${item.tone}`} role={item.tone === 'error' ? 'alert' : 'status'}>
            {item.tone === 'success' && <Icon name="check" size={18} />}
            <span>{item.message}</span>
          </div>
        ))}
      </div>
      <Sheet
        open={!!dialog}
        onClose={() => close(false)}
        title={dialog?.title}
        footer={dialog && (
          <div className="btn-row">
            <button type="button" className="btn btn-quiet" onClick={() => close(false)}>{dialog.cancelLabel || 'Cancelar'}</button>
            <button type="button" data-autofocus className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)}>
              {dialog.confirmLabel || 'Confirmar'}
            </button>
          </div>
        )}
      >
        {dialog?.message && <p className="sheet-text">{dialog.message}</p>}
      </Sheet>
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  return useContext(FeedbackContext)
}
