import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  ClipboardList, Bell, User, LogOut, Building2, Menu, X
} from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['all'] },
    { to: '/students', icon: Users, label: 'Students', roles: ['super_admin', 'institution_admin', 'lecturer'] },
    { to: '/courses', icon: BookOpen, label: 'Courses', roles: ['all'] },
    { to: '/grades', icon: GraduationCap, label: 'Grades', roles: ['all'] },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance', roles: ['all'] },
    { to: '/alerts', icon: Bell, label: 'Alerts', roles: ['all'] },
    { to: '/institutions', icon: Building2, label: 'Institutions', roles: ['super_admin'] },
    { to: '/profile', icon: User, label: 'Profile', roles: ['all'] },
  ]

  const filteredNav = navItems.filter(item =>
    item.roles.includes('all') || item.roles.includes(user?.role)
  )

  return (
    <div className='flex h-screen overflow-hidden' style={{ background: 'var(--dark)' }}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex flex-col`}
        style={{ background: 'var(--dark-secondary)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className='flex items-center justify-between p-4' style={{ borderBottom: '1px solid var(--border)' }}>
          {sidebarOpen && (
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-lg flex items-center justify-center'
                style={{ background: 'var(--primary)' }}>
                <span className='text-white font-bold text-sm'>EP</span>
              </div>
              <span className='font-bold text-lg' style={{ color: 'var(--text)' }}>EduPulse</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ color: 'var(--text-muted)' }}
            className='hover:text-white transition-colors'>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className='flex-1 p-3 flex flex-col gap-1'>
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? 'text-white' : 'hover:text-white'}`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-muted)'
              })}>
              <Icon size={20} />
              {sidebarOpen && <span className='text-sm font-medium'>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className='p-3' style={{ borderTop: '1px solid var(--border)' }}>
          {sidebarOpen && (
            <div className='mb-2 px-3 py-2'>
              <p className='text-sm font-medium' style={{ color: 'var(--text)' }}>
                {user?.first_name} {user?.last_name}
              </p>
              <p className='text-xs capitalize' style={{ color: 'var(--text-muted)' }}>
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          )}
          <button onClick={handleLogout}
            className='flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-200 hover:text-white'
            style={{ color: 'var(--text-muted)' }}>
            <LogOut size={20} />
            {sidebarOpen && <span className='text-sm font-medium'>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 overflow-auto p-6'>
        <Outlet />
      </main>
    </div>
  )
}
