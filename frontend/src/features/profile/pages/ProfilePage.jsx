import { useEffect, useRef, useState } from 'react'
import { PasswordSheet } from '@/features/profile/components/PasswordSheet'
import { SettingsSheet } from '@/features/profile/components/SettingsSheet'
import { ageFrom, bmiFrom } from '@/features/profile/domain/body'
import { squarePhoto } from '@/features/profile/services/photo'
import { DiscoverySheet } from '@/features/social'
import { useAction } from '@/shared/hooks/useAction'
import { useAsync } from '@/shared/hooks/useAsync'
import { monthStats, streak } from '@/shared/lib/activity'
import { dateKey, formatDay } from '@/shared/lib/date'
import { formatNumber, numberOrNull } from '@/shared/lib/number'
import { formatVolume } from '@/shared/lib/training'
import { Avatar } from '@/shared/ui/Avatar'
import { Stepper } from '@/shared/ui/Fields'
import { Icon } from '@/shared/ui/Icon'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Action, ActionList, Sheet } from '@/shared/ui/Sheet'
import { StatCard } from '@/shared/ui/StatCard'
import { ErrorState, Skeleton } from '@/shared/ui/States'
import { useFeedback } from '@/shared/ui/feedbackContext'
import { profileApi } from '@/shared/api/identity'
import { sessionsApi } from '@/shared/api/workout'

function toForm(profile) {
  return {
    name: profile.name || '',
    weightKg: profile.weightKg != null ? String(Number(profile.weightKg)) : '',
    heightCm: profile.heightCm != null ? String(profile.heightCm) : '',
    birthDate: profile.birthDate || ''
  }
}

export function ProfilePage() {
  const { toast, confirm } = useFeedback()
  const runAction = useAction()
  const fileRef = useRef(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMenu, setPhotoMenu] = useState(false)
  const [sheet, setSheet] = useState(null)
  const { data, error, loading, reload, setData } = useAsync(
    () =>
      Promise.all([profileApi.get(), sessionsApi.list('finished')]).then(([profile, finished]) => ({
        profile,
        finished
      })),
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
    await runAction(async () => {
      const next = await profileApi.update({
        name: form.name.trim() || null,
        weightKg,
        heightCm: heightCm == null ? null : Math.round(heightCm),
        birthDate: form.birthDate || null
      })
      setProfile(next)
      setForm(toForm(next))
      toast('Perfil salvo.', 'success')
    })
    setSaving(false)
  }

  async function pickPhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    await runAction(async () => {
      const dataUrl = await squarePhoto(file)
      setProfile(await profileApi.updatePhoto(dataUrl))
      toast('Foto atualizada.', 'success')
    })
    setPhotoBusy(false)
  }

  async function removePhoto() {
    setPhotoMenu(false)
    const ok = await confirm({ title: 'Remover foto?', confirmLabel: 'Remover', danger: true })
    if (!ok) return
    await runAction(async () => {
      await profileApi.deletePhoto()
      setProfile({ ...profile, photo: null })
      toast('Foto removida.')
    })
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
        {profile.username && <p className="profile-username">@{profile.username}</p>}
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
          <StatCard
            icon="trophy"
            value={finished.length}
            label={finished.length === 1 ? 'treino no total' : 'treinos no total'}
          />
          <StatCard icon="flame" value={currentStreak} label={currentStreak === 1 ? 'dia seguido' : 'dias seguidos'} />
          <StatCard
            icon="calendar"
            value={month.count}
            label={month.count === 1 ? 'treino no mês' : 'treinos no mês'}
          />
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
            icon={<Icon name="user" />}
            label="Como me acham"
            hint={profile.username ? `@${profile.username}` : 'Escolha seu username'}
            onClick={() => setSheet('discovery')}
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

      <DiscoverySheet
        open={sheet === 'discovery'}
        profile={profile}
        onClose={() => setSheet(null)}
        onSaved={setProfile}
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
