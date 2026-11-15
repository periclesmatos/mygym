import { useEffect, useState } from 'react'
import { setToken } from '@/shared/api/token'
import { Sheet } from '@/shared/ui/Sheet'
import { profileApi } from '@/shared/api/identity'

/** Troca de e-mail; exige a senha atual e grava o token novo. */
export function EmailSheet({ open, profile, onClose, onDone }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail(profile.email)
      setPassword('')
      setError('')
      setBusy(false)
    }
  }, [open, profile.email])

  async function submit(event) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Preencha o e-mail e a senha atual.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await profileApi.changeEmail(email.trim(), password)
      setToken(response.token)
      onDone(response.email)
    } catch (caught) {
      setError(caught.message)
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Trocar e-mail" subtitle="Você passa a entrar com o novo e-mail.">
      {!profile.hasPassword ? (
        <p className="sheet-text">
          Sua conta entra só pelo Google ou pela Apple. Defina uma senha primeiro para poder trocar o e-mail.
        </p>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          <label className="field">
            <span className="field-label">Novo e-mail</span>
            <input
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              data-autofocus
            />
          </label>
          <label className="field">
            <span className="field-label">Senha atual</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Salvando…' : 'Salvar e-mail'}
          </button>
        </form>
      )}
    </Sheet>
  )
}
