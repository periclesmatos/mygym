import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { Layout } from '@/app/Layout'
import { LoginPage } from '@/features/auth'
import { ProfilePage } from '@/features/profile'
import { AUTH_EXPIRED_EVENT } from '@/shared/api/client'
import { getToken } from '@/shared/api/token'

function RequireAuth() {
  if (!getToken()) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Quando a API recusa o token (expirado, conta removida), volta para o login. */
function useAuthExpiredRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    const onExpired = () => navigate('/login', { replace: true })
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [navigate])
}

export function App() {
  useAuthExpiredRedirect()
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/perfil" replace />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
