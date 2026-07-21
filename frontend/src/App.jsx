import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Courses from './pages/Courses'
import Grades from './pages/Grades'
import Attendance from './pages/Attendance'
import Alerts from './pages/Alerts'
import Profile from './pages/Profile'
import Institutions from './pages/Institutions'
import Layout from './components/Layout'

const queryClient = new QueryClient()

function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuthStore()

  if (!token) return <Navigate to='/login' />
  if (roles && !roles.includes(user?.role)) return <Navigate to='/dashboard' />

  return children
}

export default function App() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position='top-right' />
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/' element={<Navigate to='/dashboard' />} />
          <Route path='/' element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path='dashboard' element={<Dashboard />} />
            <Route path='students' element={
              <ProtectedRoute roles={['super_admin', 'institution_admin', 'lecturer']}>
                <Students />
              </ProtectedRoute>
            } />
            <Route path='courses' element={<Courses />} />
            <Route path='grades' element={<Grades />} />
            <Route path='attendance' element={<Attendance />} />
            <Route path='alerts' element={<Alerts />} />
            <Route path='profile' element={<Profile />} />
            <Route path='institutions' element={
              <ProtectedRoute roles={['super_admin']}>
                <Institutions />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}
