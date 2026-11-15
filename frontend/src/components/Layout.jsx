import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon } from '../ui/Icon'

const TABS = [
  { to: '/', label: 'Início', icon: 'home', end: true },
  { to: '/rotina', label: 'Rotina', icon: 'routine' },
  { to: '/historico', label: 'Histórico', icon: 'history' },
  { to: '/evolucao', label: 'Evolução', icon: 'chart' }
]

/** Telas de foco (treino em andamento, editores) escondem a barra de abas. */
function isFocused(pathname) {
  return /^\/treino\//.test(pathname) || /^\/rotina\/(novo|\d+)$/.test(pathname)
}

export function Layout() {
  const { pathname } = useLocation()
  const focused = isFocused(pathname)
  return (
    <div className={focused ? 'app focused' : 'app'}>
      <main key={pathname} className="page">
        <Outlet />
      </main>
      {!focused && (
        <nav className="tabbar" aria-label="Navegação principal">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end}>
              <Icon name={tab.icon} size={22} />
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
