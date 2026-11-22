import { useState } from 'react'
import { useAction } from '@/shared/hooks/useAction'
import { useFeedback } from '@/shared/ui/feedbackContext'
import { profileApi } from '@/shared/api/identity'

/** Conta sem @username escolhe um aqui. */
export function UsernameCard({ onSaved }) {
  const runAction = useAction()
  const { toast } = useFeedback()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    await runAction(async () => {
      const profile = await profileApi.changeUsername(value)
      toast(`Pronto, você é @${profile.username}.`, 'success')
      onSaved(profile)
    })
    setBusy(false)
  }

  return (
    <form className="card stack" onSubmit={save}>
      <strong>Escolha seu @username</strong>
      <p className="muted small">É por ele que seus amigos te acham.</p>
      <div className="input-row">
        <input
          className="input"
          aria-label="Username"
          placeholder="ex.: pedro_treina"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck="false"
          maxLength={21}
          value={value}
          onChange={(event) => setValue(event.target.value.toLowerCase())}
        />
        <button type="submit" className="btn btn-primary" disabled={busy || value.trim().length < 3}>
          Salvar
        </button>
      </div>
    </form>
  )
}
