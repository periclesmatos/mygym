import { useEffect, useState } from 'react'
import { passwordError } from '@/features/auth'
import { Sheet } from '@/shared/ui/Sheet'
import { profileApi } from '@/shared/api/identity'

/** Troca de senha, ou criação para quem só entrou com Google/Apple. */
export function PasswordSheet({ open, hasPassword, onClose, onDone }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setCurrent('')
      setNext('')
      setRepeat('')
      setError('')
      setBusy(false)
    }
  }, [open])

  async function submit(event) {
    event.preventDefault()
    if (hasPassword && !current) {
      setError('Informe a senha atual.')
      return
    }
    if (passwordError(next, 'A nova senha')) {
      setError(passwordError(next, 'A nova senha'))
      return
    }
    if (next !== repeat) {
      setError('As senhas não conferem.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await profileApi.changePassword(hasPassword ? current : null, next)
      onDone()
    } catch (caught) {
      setError(caught.message)
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={hasPassword ? 'Trocar senha' : 'Definir senha'}>
      <form className="stack" onSubmit={submit} noValidate>
        {hasPassword && (
          <label className="field">
            <span className="field-label">Senha atual</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              data-autofocus
            />
          </label>
        )}
        <label className="field">
          <span className="field-label">Nova senha</span>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            data-autofocus={hasPassword ? undefined : true}
          />
        </label>
        <label className="field">
          <span className="field-label">Repita a nova senha</span>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar senha'}
        </button>
      </form>
    </Sheet>
  )
}
