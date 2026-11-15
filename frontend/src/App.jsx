import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { getToken } from './api'
import { Layout } from './components/Layout'
import { History } from './pages/History'
import { HistoryDay } from './pages/HistoryDay'
import { HistoryDetail } from './pages/HistoryDetail'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { ProgressDetail, ProgressList } from './pages/Progress'
import { Routine } from './pages/Routine'
import { RoutineEditor } from './pages/RoutineEditor'
import { Workout } from './pages/Workout'

function RequireAuth() {
  if (!getToken()) return <Navigate to="/login" replace />
  return <Outlet />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/rotina" element={<Routine />} />
          <Route path="/rotina/novo" element={<RoutineEditor />} />
          <Route path="/rotina/:id" element={<RoutineEditor />} />
          <Route path="/treino/:id" element={<Workout />} />
          <Route path="/historico" element={<History />} />
          <Route path="/historico/dia/:date" element={<HistoryDay />} />
          <Route path="/historico/:id" element={<HistoryDetail />} />
          <Route path="/evolucao" element={<ProgressList />} />
          <Route path="/evolucao/exercicio" element={<ProgressDetail />} />
          <Route path="/perfil" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
