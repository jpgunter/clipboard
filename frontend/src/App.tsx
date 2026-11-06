import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import CreateTeam from './pages/CreateTeam'
import Dashboard from './pages/Dashboard'
import EventsCalendar from './pages/EventsCalendar'
import Login from './pages/Login'
import MessagingCenter from './pages/MessagingCenter'
import TeamView from './pages/TeamView'

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-6 text-gray-400">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected><Layout /></Protected>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teams/create" element={<CreateTeam />} />
            <Route path="/teams/:teamId" element={<TeamView />} />
            <Route path="/events" element={<EventsCalendar />} />
            <Route path="/messages" element={<MessagingCenter />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
