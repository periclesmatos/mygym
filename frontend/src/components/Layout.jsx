import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearToken } from '../api'
import { currentTheme, toggleTheme } from '../theme'

function backTarget(pathname) {
  if (pathname === '/templates/new' || /^\/templates\/\d+$/.test(pathname)) return '/templates'
  if (pathname === '/workout/new' || /^\/workout\/\d+$/.test(pathname)) return '/'
  if (/^\/history\/dia\/\d{4}-\d{2}-\d{2}$/.test(pathname)) return '/'
  if (/^\/history\/\d+$/.test(pathname)) return '/history'
  return null
}

export function Layout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const back = backTarget(pathname)
  const [theme, setTheme] = useState(currentTheme)

  function signOut() {
    clearToken()
    navigate('/login')
  }

  function switchTheme() {
    setTheme(toggleTheme())
  }

  return (
    <div className="app">
      <header className="topbar">
        {back ? (
          <button type="button" className="icon-button" aria-label="Voltar" onClick={() => {
            const index = window.history.state?.idx
            if (typeof index === 'number' && index > 0) navigate(-1)
            else navigate(back)
          }}>
            <Chevron />
          </button>
        ) : <strong className="brand">Treino</strong>}
        <div className="top-actions">
          <button type="button" className="icon-button" aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'} onClick={switchTheme}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
          <button type="button" className="text-button" onClick={signOut}>Sair</button>
        </div>
      </header>
      <main>
        <div key={pathname} className="page">
          <Outlet />
        </div>
      </main>
      <nav className="tabs">
        <NavLink to="/" end><HomeIcon />Início</NavLink>
        <NavLink to="/templates"><PlanIcon />Meu treino</NavLink>
        <NavLink to="/history"><HistoryIcon />Histórico</NavLink>
      </nav>
    </div>
  )
}

function Chevron() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Sun() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function Moon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

function PlanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6h11M8 12h11M8 18h11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
