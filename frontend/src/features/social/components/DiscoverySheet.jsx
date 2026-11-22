import { useEffect, useState } from 'react'
import { useAction } from '@/shared/hooks/useAction'
import { Sheet } from '@/shared/ui/Sheet'
import { useFeedback } from '@/shared/ui/feedbackContext'
import { profileApi } from '@/shared/api/identity'

function toForm(profile) {
  return {
    username: profile.username || '',
    phone: profile.phone || '',
    phoneSearchable: profile.phoneSearchable,
    emailSearchable: profile.emailSearchable
  }
}

/** Username, telefone e por onde a pessoa pode ser achada. */
export function DiscoverySheet({ open, profile, onClose, onSaved }) {
  const runAction = useAction()
  const { toast } = useFeedback()
  const [form, setForm] = useState(() => toForm(profile))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setForm(toForm(profile))
  }, [open, profile])

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    await runAction(async () => {
      const username = form.username.trim()
      if (username && username !== profile.username) await profileApi.changeUsername(username)
      const next = await profileApi.changeDiscovery({
        phone: form.phone.trim() || null,
        phoneSearchable: form.phoneSearchable,
        emailSearchable: form.emailSearchable
      })
      onSaved(next)
      onClose()
      toast('Salvo.', 'success')
    })
    setBusy(false)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Como me acham">
      <form className="stack" onSubmit={save}>
        <label className="field">
          <span className="field-label">Username</span>
          <input
            className="input"
            autoCapitalize="none"
            autoComplete="off"
            maxLength={21}
            value={form.username}
            onChange={(event) => set('username', event.target.value.toLowerCase())}
          />
        </label>
        <label className="field">
          <span className="field-label">Telefone (opcional)</span>
          <input
            className="input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            maxLength={30}
            value={form.phone}
            onChange={(event) => set('phone', event.target.value)}
          />
        </label>
        <label className="check-line">
          <input
            type="checkbox"
            disabled={!form.phone.trim()}
            checked={Boolean(form.phone.trim()) && form.phoneSearchable}
            onChange={(event) => set('phoneSearchable', event.target.checked)}
          />
          <span>Podem me achar pelo telefone</span>
        </label>
        <label className="check-line">
          <input
            type="checkbox"
            checked={form.emailSearchable}
            onChange={(event) => set('emailSearchable', event.target.checked)}
          />
          <span>Podem me achar pelo e-mail</span>
        </label>
        {!profile.emailVerified && (
          <p className="muted small">
            A busca por e-mail só te acha depois que ele for confirmado. Entrar com Google confirma, se a conta já
            estiver vinculada.
          </p>
        )}
        <p className="muted small">Ninguém vê seu e-mail nem seu telefone, nem mesmo seus amigos.</p>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
    </Sheet>
  )
}
