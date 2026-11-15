import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { Layout } from '@/app/Layout'
import { LoginPage } from '@/features/auth'
import { HistoryDayPage, HistoryDetailPage, HistoryPage } from '@/features/history'
import { ProfilePage } from '@/features/profile'
import { RoutineEditorPage, RoutinePage } from '@/features/routine'
import { WorkoutPage } from '@/features/workout'
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
          <Route path="/rotina" element={<RoutinePage />} />
          <Route path="/rotina/novo" element={<RoutineEditorPage />} />
          <Route path="/rotina/:id" element={<RoutineEditorPage />} />
          <Route path="/treino/:id" element={<WorkoutPage />} />
          <Route path="/historico" element={<HistoryPage />} />
          <Route path="/historico/dia/:date" element={<HistoryDayPage />} />
          <Route path="/historico/:id" element={<HistoryDetailPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
