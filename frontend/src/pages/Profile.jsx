import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { Avatar } from '../components/Avatar'
import { squarePhoto } from '../photo'
import { SettingsSheet } from '../components/SettingsSheet'
import { dateKey, formatDay, formatNumber, formatVolume, numberOrNull } from '../format'
import { monthStats, streak } from '../plan'
import { useFeedback } from '../ui/feedbackContext'
import { Stepper } from '../ui/Fields'
import { useAsync } from '../ui/hooks'
import { Icon } from '../ui/Icon'
import { PageHeader } from '../ui/PageHeader'
import { Action, ActionList, Sheet } from '../ui/Sheet'
import { ErrorState, Skeleton } from '../ui/States'

function ageFrom(birthDate, now = new Date()) {
  if (!birthDate) return null
  const [year, month, day] = birthDate.split('-').map(Number)
  let age = now.getFullYear() - year
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) age -= 1
  return age >= 0 ? age : null
}

function bmiFrom(weight, height) {
  const kg = numberOrNull(weight)
  const cm = numberOrNull(height)
  if (!kg || !cm) return null
  return kg / (cm / 100) ** 2
}

function toForm(profile) {
  return {
    name: profile.name || '',
    weightKg: profile.weightKg != null ? String(Number(profile.weightKg)) : '',
    heightCm: profile.heightCm != null ? String(profile.heightCm) : '',
    birthDate: profile.birthDate || ''
  }
}

export function Profile() {
  const { toast, confirm } = useFeedback()
  const fileRef = useRef(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMenu, setPhotoMenu] = useState(false)
  const [sheet, setSheet] = useState(null)
  const { data, error, loading, reload, setData } = useAsync(
    () => Promise.all([api.profile(), api.sessions('finished')]).then(([profile, finished]) => ({ profile, finished })),
    []
  )

  useEffect(() => {
    if (data?.profile && form === null) setForm(toForm(data.profile))
  }, [data, form])

  if (error)
    return (
      <>
        <PageHeader back="/" title="Perfil" />
        <ErrorState message={error} onRetry={reload} />
      </>
    )
  if ((loading && !data) || !form)
    return (
      <>
        <PageHeader back="/" title="Perfil" />
        <Skeleton lines={2} />
        <Skeleton lines={4} />
      </>
    )

  const { profile, finished } = data
  const setProfile = (next) => setData((current) => ({ ...current, profile: next }))
  const update = (field) => (value) => setForm((current) => ({ ...current, [field]: value }))
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(profile))

  const totalVolume = finished.reduce((sum, session) => sum + Number(session.volume || 0), 0)
  const firstWorkout = finished.length ? finished[finished.length - 1].finishedAt : null
  const memberSince =
    profile.createdAt && (!firstWorkout || profile.createdAt < firstWorkout) ? profile.createdAt : firstWorkout
  const month = monthStats(finished)
  const currentStreak = streak(finished)
  const age = ageFrom(form.birthDate)
  const bmi = bmiFrom(form.weightKg, form.heightCm)

  async function save(event) {
    event.preventDefault()
    const weightKg = numberOrNull(form.weightKg)
    const heightCm = numberOrNull(form.heightCm)
    if (form.weightKg.trim() && weightKg == null) {
      toast('Peso inválido.', 'error')
      return
    }
    if (form.heightCm.trim() && heightCm == null) {
      toast('Altura inválida.', 'error')
      return
    }
    setSaving(true)
    try {
      const next = await api.updateProfile({
        name: form.name.trim() || null,
        weightKg,
        heightCm: heightCm == null ? null : Math.round(heightCm),
        birthDate: form.birthDate || null
      })
      setProfile(next)
      setForm(toForm(next))
      toast('Perfil salvo.', 'success')
    } catch (caught) {
      toast(caught.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function pickPhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    try {
      const dataUrl = await squarePhoto(file)
      setProfile(await api.updatePhoto(dataUrl))
      toast('Foto atualizada.', 'success')
    } catch (caught) {
      toast(caught.message, 'error')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function removePhoto() {
    setPhotoMenu(false)
    const ok = await confirm({ title: 'Remover foto?', confirmLabel: 'Remover', danger: true })
    if (!ok) return
    try {
      await api.deletePhoto()
      setProfile({ ...profile, photo: null })
      toast('Foto removida.')
    } catch (caught) {
      toast(caught.message, 'error')
    }
  }

  function changePhoto() {
    if (profile.photo) setPhotoMenu(true)
    else fileRef.current?.click()
  }

  return (
    <>
      <PageHeader back="/" title="Perfil" />

      <section className="profile-hero">
        <button
          type="button"
          className="profile-photo"
          onClick={changePhoto}
          disabled={photoBusy}
          aria-label={profile.photo ? 'Trocar ou remover foto' : 'Adicionar foto'}
        >
          <Avatar profile={profile} size={104} />
          <span className="profile-photo-badge">
            <Icon name="camera" size={18} />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
        <h2>{profile.name || 'Sem nome'}</h2>
        <p className="muted">{profile.email}</p>
        {(profile.google || profile.apple) && (
          <div className="profile-badges">
            {profile.google && <span className="badge sm">Google conectado</span>}
            {profile.apple && <span className="badge sm">Apple conectada</span>}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Resumo</h2>
          {memberSince && (
            <span className="muted small">
              desde {formatDay(memberSince, { month: 'long', year: 'numeric' }).toLowerCase()}
            </span>
          )}
        </div>
        <div className="stats">
          <div className="stat">
            <Icon name="trophy" size={20} />
            <strong>{finished.length}</strong>
            <span>{finished.length === 1 ? 'treino no total' : 'treinos no total'}</span>
          </div>
          <div className="stat">
            <Icon name="flame" size={20} />
            <strong>{currentStreak}</strong>
            <span>{currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}</span>
          </div>
          <div className="stat">
            <Icon name="calendar" size={20} />
            <strong>{month.count}</strong>
            <span>{month.count === 1 ? 'treino no mês' : 'treinos no mês'}</span>
          </div>
        </div>
        <div className="stat stat-wide">
          <Icon name="dumbbell" size={20} />
          <strong>{formatVolume(totalVolume) || '0 kg'}</strong>
          <span>levantados em todos os treinos</span>
        </div>
      </section>

      <form className="section" onSubmit={save}>
        <div className="section-head">
          <h2>Seus dados</h2>
        </div>
        <div className="card stack">
          <label className="field">
            <span className="field-label">Nome</span>
            <input
              className="input"
              autoComplete="name"
              maxLength={80}
              value={form.name}
              onChange={(event) => update('name')(event.target.value)}
            />
          </label>
          <div className="grid-2">
            <Stepper
              label="Peso"
              suffix="kg"
              step={0.5}
              min={20}
              max={400}
              seed={70}
              allowEmpty
              value={form.weightKg}
              onChange={update('weightKg')}
            />
            <Stepper
              label="Altura"
              suffix="cm"
              step={1}
              min={80}
              max={250}
              seed={170}
              allowEmpty
              inputMode="numeric"
              value={form.heightCm}
              onChange={update('heightCm')}
            />
          </div>
          <label className="field">
            <span className="field-label">Nascimento</span>
            <input
              className="input"
              type="date"
              max={dateKey(new Date())}
              value={form.birthDate}
              onChange={(event) => update('birthDate')(event.target.value)}
            />
          </label>
          {(age != null || bmi != null) && (
            <p className="muted small">
              {age != null && `${age} anos`}
              {age != null && bmi != null && ' · '}
              {bmi != null && `IMC ${formatNumber(bmi, 1)}`}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={saving || !dirty}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>

      <section className="section">
        <div className="section-head">
          <h2>Conta</h2>
        </div>
        <ActionList>
          <Action
            icon={<Icon name="mail" />}
            label="Trocar e-mail"
            hint={profile.email}
            onClick={() => setSheet('email')}
          />
          <Action
            icon={<Icon name="lock" />}
            label={profile.hasPassword ? 'Trocar senha' : 'Definir senha'}
            hint={profile.hasPassword ? undefined : 'Para entrar também com e-mail e senha'}
            onClick={() => setSheet('password')}
          />
          <Action
            icon={<Icon name="settings" />}
            label="Ajustes"
            hint="Tema e sair"
            onClick={() => setSheet('settings')}
          />
        </ActionList>
      </section>

      <Sheet open={photoMenu} onClose={() => setPhotoMenu(false)} title="Foto">
        <ActionList>
          <Action
            icon={<Icon name="camera" />}
            label="Trocar foto"
            onClick={() => {
              setPhotoMenu(false)
              fileRef.current?.click()
            }}
          />
          <Action icon={<Icon name="trash" />} label="Remover foto" danger onClick={removePhoto} />
        </ActionList>
      </Sheet>

      <EmailSheet
        open={sheet === 'email'}
        profile={profile}
        onClose={() => setSheet(null)}
        onDone={(email) => {
          setProfile({ ...profile, email })
          setSheet(null)
          toast('E-mail atualizado.', 'success')
        }}
      />
      <PasswordSheet
        open={sheet === 'password'}
        hasPassword={profile.hasPassword}
        onClose={() => setSheet(null)}
        onDone={() => {
          setProfile({ ...profile, hasPassword: true })
          setSheet(null)
          toast('Senha salva.', 'success')
        }}
      />
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} />
    </>
  )
}

function EmailSheet({ open, profile, onClose, onDone }) {
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
      const response = await api.changeEmail(email.trim(), password)
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

function PasswordSheet({ open, hasPassword, onClose, onDone }) {
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
    if (next.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (next !== repeat) {
      setError('As senhas não conferem.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.changePassword(hasPassword ? current : null, next)
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
