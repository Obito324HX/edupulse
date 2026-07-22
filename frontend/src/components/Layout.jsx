import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  ClipboardList, Bell, User, LogOut, Building2, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import PulseLogo from './PulseLogo'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  // Desktop: collapses the sidebar to an icon rail. Mobile: ignored — mobile
  // always uses the full off-canvas drawer instead, controlled separately.
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const NavList = ({ showLabels, onNavigate }) => (
    <nav className='flex-1 p-3 flex flex-col gap-1'>
      {filteredNav.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} onClick={onNavigate}
          className={({ isActive }) =>
            `relative flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? '' : 'hover:text-[var(--text)]'}`
          }
          style={({ isActive }) => ({
            background: isActive ? `rgba(var(--primary-rgb), 0.12)` : 'transparent',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)'
          })}>
          {({ isActive }) => (
            <>
              <span
                className='absolute left-0 top-1.5 bottom-1.5 rounded-full transition-all duration-200'
                style={{ width: 3, background: isActive ? 'var(--primary)' : 'transparent' }}
              />
              <Icon size={20} className='shrink-0' />
              {showLabels && <span className='text-sm font-medium'>{label}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )

  const UserFooter = ({ showLabels, collapsedToggle = false }) => (
    <div className='p-3' style={{ borderTop: '1px solid var(--border)' }}>
      {showLabels && (
        <div className='mb-2 px-3 py-2 min-w-0'>
          <p className='text-sm font-medium truncate' style={{ color: 'var(--text)' }}>
            {user?.first_name} {user?.last_name}
          </p>
          <p className='text-xs capitalize' style={{ color: 'var(--text-muted)' }}>
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
      )}
      <ThemeToggle collapsed={collapsedToggle} />
      <button onClick={handleLogout}
        className='flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-200 hover:text-[var(--text)]'
        style={{ color: 'var(--text-muted)' }}>
        <LogOut size={20} className='shrink-0' />
        {showLabels && <span className='text-sm font-medium'>Logout</span>}
      </button>
    </div>
  )

  return (
    <div className='flex h-screen overflow-hidden' style={{ background: 'var(--dark)' }}>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className='fixed inset-0 z-30 lg:hidden'
          style={{ background: 'var(--overlay)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile off-canvas drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[80vw] flex flex-col transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--dark-secondary)', borderRight: '1px solid var(--border)' }}
      >
        <div className='flex items-center justify-between p-4' style={{ borderBottom: '1px solid var(--border)' }}>
          <div className='flex items-center gap-2 min-w-0'>
            <PulseLogo size={32} />
            <span className='font-bold text-lg truncate' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>EduPulse</span>
          </div>
          <button onClick={() => setMobileOpen(false)}
            style={{ color: 'var(--text-muted)' }}
            className='hover:text-[var(--text)] transition-colors shrink-0'>
            <X size={22} />
          </button>
        </div>
        <NavList showLabels onNavigate={() => setMobileOpen(false)} />
        <UserFooter showLabels />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex ${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex-col shrink-0`}
        style={{ background: 'var(--dark-secondary)', borderRight: '1px solid var(--border)' }}>

        <div className='flex items-center justify-between p-4' style={{ borderBottom: '1px solid var(--border)' }}>
          {sidebarOpen && (
            <div className='flex items-center gap-2 min-w-0'>
              <PulseLogo size={32} />
              <span className='font-bold text-lg truncate' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>EduPulse</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ color: 'var(--text-muted)' }}
            className='hover:text-[var(--text)] transition-colors shrink-0'>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <NavList showLabels={sidebarOpen} />
        <UserFooter showLabels={sidebarOpen} collapsedToggle={!sidebarOpen} />
      </aside>

      {/* Main column */}
      <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>

        {/* Mobile top bar */}
        <div className='flex lg:hidden items-center justify-between px-4 py-3 shrink-0'
          style={{ background: 'var(--dark-secondary)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setMobileOpen(true)}
            style={{ color: 'var(--text)' }}>
            <Menu size={24} />
          </button>
          <div className='flex items-center gap-2'>
            <PulseLogo size={26} />
            <span className='font-bold' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>EduPulse</span>
          </div>
          <ThemeToggle variant='icon' />
        </div>

        <main className='flex-1 overflow-auto p-4 sm:p-6'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
