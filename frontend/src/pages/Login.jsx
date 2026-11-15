import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken, setToken } from '../api'
import { Icon } from '../ui/Icon'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (getToken()) navigate('/', { replace: true })
  }, [navigate])

  async function submit(event) {
    event.preventDefault()
    if (!email.trim() || !password) { setError('Preencha e-mail e senha.'); return }
    setBusy(true)
    setError('')
    try {
      const response = await api.login(email.trim(), password)
      setToken(response.token)
      navigate('/', { replace: true })
    } catch (caught) {
      setError(caught.message)
      setBusy(false)
    }
  }

  return (
    <main className="login">
      <div className="login-brand">
        <span className="logo"><Icon name="dumbbell" size={30} strokeWidth={2.4} /></span>
        <h1>Treino</h1>
        <p className="muted">Sua rotina, suas cargas e sua evolução num lugar só.</p>
      </div>
      <form className="card login-card stack" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field-label">E-mail</span>
          <input className="input" type="email" autoComplete="username" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} autoFocus />
        </label>
        <label className="field">
          <span className="field-label">Senha</span>
          <div className="input-wrap">
            <input className="input" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <button type="button" className="input-addon" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}>
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} />
            </button>
          </div>
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>
  )
}
