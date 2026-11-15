import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MIN_PASSWORD_LENGTH, passwordError } from '@/features/auth/domain/password'
import { renderGoogleButton, signInWithApple } from '@/features/auth/services/social'
import { getToken, setToken } from '@/shared/api/token'
import { Segmented } from '@/shared/ui/Fields'
import { Icon } from '@/shared/ui/Icon'
import { authApi } from '@/shared/api/identity'

export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [config, setConfig] = useState(null)
  const googleRef = useRef(null)
  const registering = mode === 'register'

  useEffect(() => {
    if (getToken()) navigate('/', { replace: true })
  }, [navigate])

  useEffect(() => {
    let active = true
    authApi
      .config()
      .then((data) => {
        if (active) setConfig(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  function enter(response) {
    setToken(response.token)
    navigate('/', { replace: true })
  }

  async function run(action) {
    setBusy(true)
    setError('')
    try {
      const response = await action()
      if (response) enter(response)
      else setBusy(false)
    } catch (caught) {
      setError(caught.message)
      setBusy(false)
    }
  }

  const runRef = useRef(run)
  runRef.current = run

  useEffect(() => {
    const element = googleRef.current
    if (!config?.googleClientId || !element) return
    renderGoogleButton(element, config.googleClientId, (credential) =>
      runRef.current(() => authApi.loginGoogle(credential))
    ).catch((caught) => setError(caught.message))
  }, [config])

  function submit(event) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.')
      return
    }
    if (registering && passwordError(password)) {
      setError(passwordError(password))
      return
    }
    run(() =>
      registering
        ? authApi.register({ name: name.trim() || null, email: email.trim(), password })
        : authApi.login(email.trim(), password)
    )
  }

  function apple() {
    run(async () => {
      const result = await signInWithApple({ clientId: config.appleClientId, redirectUri: config.appleRedirectUri })
      return result ? authApi.loginApple(result.idToken, result.name) : null
    })
  }

  const hasSocial = !!(config?.googleClientId || config?.appleClientId)

  return (
    <main className="login">
      <div className="login-brand">
        <span className="logo">
          <Icon name="dumbbell" size={30} strokeWidth={2.4} />
        </span>
        <h1>Treino</h1>
        <p className="muted">Sua rotina, suas cargas e sua evolução num lugar só.</p>
      </div>
      <form className="card login-card stack" onSubmit={submit} noValidate>
        <Segmented
          label="Acesso"
          value={mode}
          onChange={(value) => {
            setMode(value)
            setError('')
          }}
          options={[
            { value: 'login', label: 'Entrar' },
            { value: 'register', label: 'Criar conta' }
          ]}
        />
        {registering && (
          <label className="field">
            <span className="field-label">Nome</span>
            <input
              className="input"
              autoComplete="name"
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}
        <label className="field">
          <span className="field-label">E-mail</span>
          <input
            className="input"
            type="email"
            autoComplete={registering ? 'email' : 'username'}
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoFocus
          />
        </label>
        <label className="field">
          <span className="field-label">Senha</span>
          <div className="input-wrap">
            <input
              className="input"
              type={showPassword ? 'text' : 'password'}
              autoComplete={registering ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="input-addon"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} />
            </button>
          </div>
          {registering && (
            <span className="muted small">
              Mínimo de {MIN_PASSWORD_LENGTH} caracteres. O cadastro é só para e-mails convidados.
            </span>
          )}
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
          {busy ? (registering ? 'Criando…' : 'Entrando…') : registering ? 'Criar conta' : 'Entrar'}
        </button>

        {hasSocial && (
          <>
            <div className="divider">
              <span>ou</span>
            </div>
            <div className="social">
              {config.googleClientId && <div ref={googleRef} className="google-btn" />}
              {config.appleClientId && (
                <button type="button" className="btn btn-lg btn-block apple-btn" onClick={apple} disabled={busy}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                    <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-.9-2.4-3.9ZM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4Z" />
                  </svg>
                  Continuar com a Apple
                </button>
              )}
            </div>
          </>
        )}
      </form>
    </main>
  )
}
