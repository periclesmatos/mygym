import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { Layout } from '@/app/Layout'
import { LoginPage } from '@/features/auth/LoginPage'
import { HistoryDayPage } from '@/features/history/HistoryDayPage'
import { HistoryDetailPage } from '@/features/history/HistoryDetailPage'
import { HistoryPage } from '@/features/history/HistoryPage'
import { HomePage } from '@/features/home/HomePage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ProgressDetailPage, ProgressListPage } from '@/features/progress/ProgressPage'
import { RoutineEditorPage } from '@/features/routine/RoutineEditorPage'
import { RoutinePage } from '@/features/routine/RoutinePage'
import { WorkoutPage } from '@/features/workout/WorkoutPage'
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
          <Route path="/" element={<HomePage />} />
          <Route path="/rotina" element={<RoutinePage />} />
          <Route path="/rotina/novo" element={<RoutineEditorPage />} />
          <Route path="/rotina/:id" element={<RoutineEditorPage />} />
          <Route path="/treino/:id" element={<WorkoutPage />} />
          <Route path="/historico" element={<HistoryPage />} />
          <Route path="/historico/dia/:date" element={<HistoryDayPage />} />
          <Route path="/historico/:id" element={<HistoryDetailPage />} />
          <Route path="/evolucao" element={<ProgressListPage />} />
          <Route path="/evolucao/exercicio" element={<ProgressDetailPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
