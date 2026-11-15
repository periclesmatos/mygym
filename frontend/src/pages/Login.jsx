import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../api'
import { currentTheme, toggleTheme } from '../theme'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [theme, setTheme] = useState(currentTheme)

  useEffect(() => {
    if (localStorage.getItem('appgym_token')) navigate('/', { replace: true })
  }, [navigate])

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await api.login(email, password)
      setToken(response.token)
      navigate('/', { replace: true })
    } catch (caught) {
      setError(caught.message)
      setBusy(false)
    }
  }

  return (
    <main className="login">
      <button type="button" className="text-button login-theme" onClick={() => setTheme(toggleTheme())}>
        {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
      </button>
      <form className="card" onSubmit={submit}>
        <h1>Treino</h1>
        <p className="muted">Entre para ver o treino de hoje e o que você já fez.</p>
        {error && <p className="error">{error}</p>}
        <label className="field">
          <span>E-mail</span>
          <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="field">
          <span>Senha</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button className="primary wide" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <p className="muted small">Acesso local: you@appgym.local / appgym. Troque antes de publicar.</p>
      </form>
    </main>
  )
}
