import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { getToken } from './api'
import { Layout } from './components/Layout'
import { DayHistory } from './pages/DayHistory'
import { History } from './pages/History'
import { HistoryDetail } from './pages/HistoryDetail'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { NewWorkout } from './pages/NewWorkout'
import { TemplateForm } from './pages/TemplateForm'
import { Templates } from './pages/Templates'
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
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/new" element={<TemplateForm />} />
          <Route path="/templates/:id" element={<TemplateForm />} />
          <Route path="/workout/new" element={<NewWorkout />} />
          <Route path="/workout/:id" element={<Workout />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/dia/:date" element={<DayHistory />} />
          <Route path="/history/:id" element={<HistoryDetail />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
