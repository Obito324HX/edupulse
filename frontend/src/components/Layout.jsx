import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  ClipboardList, Bell, User, LogOut, Building2, Menu, X, MoreHorizontal
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import PulseLogo from './PulseLogo'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  // Desktop: collapses the sidebar to an icon rail.
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Mobile: the bottom nav's "More" sheet, for anything past the 3 primary tabs.
  const [moreOpen, setMoreOpen] = useState(false)

  // Unresolved alert count for the nav badge. Only institution_admin and
  // super_admin get a stats endpoint at all -- students/lecturers just see
  // the Alerts page itself, no badge.
  const { data: alertStats } = useQuery({
    queryKey: ['alertStats'],
    queryFn: () => api.get('/alerts/stats').then(r => r.data.stats),
    enabled: ['institution_admin', 'super_admin'].includes(user?.role)
  })
  const alertBadge = alertStats?.unresolved_alerts || 0

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

  // The bottom nav only has room for a few tabs before it's cramped again --
  // Dashboard, Grades, and Alerts are the ones that matter every day across
  // every role, everything else (Students, Courses, Attendance,
  // Institutions, Profile) lives behind "More".
  const primaryMobile = filteredNav.filter(i => ['/dashboard', '/grades', '/alerts'].includes(i.to))
  const overflowMobile = filteredNav.filter(i => !['/dashboard', '/grades', '/alerts'].includes(i.to))

  const NavList = ({ showLabels, onNavigate }) => (
    <nav className='flex-1 px-3 flex flex-col gap-0.5'>
      {filteredNav.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} onClick={onNavigate}
          className='flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-150 hover:bg-white/[0.04]'
          style={({ isActive }) => ({
            background: isActive ? 'color-mix(in srgb, var(--primary) 14%, transparent)' : undefined,
            color: isActive ? 'var(--text)' : 'var(--text-muted)'
          })}>
          {({ isActive }) => (
            <>
              <Icon size={17} strokeWidth={isActive ? 2.1 : 1.8} className='shrink-0' style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
              {showLabels && <span className='text-[13px] flex-1' style={{ fontWeight: isActive ? 600 : 500 }}>{label}</span>}
              {to === '/alerts' && alertBadge > 0 && (
                <span className='font-mono-data text-[9px] font-bold rounded-full flex items-center justify-center shrink-0'
                  style={{ minWidth: 15, height: 15, padding: '0 4px', background: 'var(--danger)', color: '#fff' }}>
                  {alertBadge > 99 ? '99+' : alertBadge}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )

  const UserFooter = ({ showLabels, collapsedToggle = false }) => (
    <div className='px-3 mt-2 flex flex-col gap-2'>
      {showLabels && (
        <div className='flex items-center gap-2.5 px-2.5 py-2 rounded-xl min-w-0' style={{ background: 'var(--dark)' }}>
          <div className='w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-semibold text-xs'
            style={{ background: 'var(--primary)', color: 'var(--on-primary)', fontFamily: "'Fraunces', serif" }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className='min-w-0'>
            <p className='text-[13px] font-medium truncate' style={{ color: 'var(--text)' }}>
              {user?.first_name} {user?.last_name}
            </p>
            <p className='text-[11px] capitalize truncate' style={{ color: 'var(--text-muted)' }}>
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      )}
      <ThemeToggle collapsed={collapsedToggle} />
      <button onClick={handleLogout}
        className='flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full transition-colors duration-150 hover:bg-white/[0.04]'
        style={{ color: 'var(--text-muted)' }}>
        <LogOut size={17} className='shrink-0' />
        {showLabels && <span className='text-[13px] font-medium'>Logout</span>}
      </button>
    </div>
  )

  return (
    <div className='flex h-screen overflow-hidden' style={{ background: 'var(--dark)' }}>

      {/* Mobile "More" sheet backdrop */}
      {moreOpen && (
        <div
          className='fixed inset-0 z-30 lg:hidden'
          style={{ background: 'var(--overlay)' }}
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* Mobile "More" sheet -- slides up from the bottom nav, holds
          everything that doesn't fit as a primary tab */}
      <aside
        className={`fixed inset-x-0 bottom-0 z-40 max-h-[75vh] flex flex-col rounded-t-2xl transition-transform duration-300 lg:hidden ${moreOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ background: 'var(--dark-secondary)', borderTop: '1px solid var(--border)' }}
      >
        <div className='flex items-center justify-between p-4' style={{ borderBottom: '1px solid var(--border)' }}>
          <div className='flex items-center gap-2 min-w-0'>
            <PulseLogo size={32} />
            <span className='font-bold text-lg truncate' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>EduPulse</span>
          </div>
          <button onClick={() => setMoreOpen(false)}
            style={{ color: 'var(--text-muted)' }}
            className='hover:text-[var(--text)] transition-colors shrink-0'>
            <X size={22} />
          </button>
        </div>
        <nav className='p-3 flex flex-col gap-0.5 overflow-y-auto'>
          {overflowMobile.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setMoreOpen(false)}
              className='flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-150'
              style={({ isActive }) => ({
                background: isActive ? 'color-mix(in srgb, var(--primary) 14%, transparent)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-muted)'
              })}>
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.1 : 1.8} className='shrink-0' style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <span className='text-[13px]' style={{ fontWeight: isActive ? 600 : 500 }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <UserFooter showLabels />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex ${sidebarOpen ? 'w-[208px]' : 'w-16'} transition-all duration-300 flex-col shrink-0 py-[22px]`}
        style={{ background: 'var(--dark-secondary)', borderRight: '1px solid var(--border)' }}>

        <div className='flex items-center justify-between px-3.5 mb-[26px]'>
          {sidebarOpen && (
            <div className='flex items-center gap-2 min-w-0'>
              <PulseLogo size={28} />
              <span className='font-semibold text-lg truncate' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>
                Edu<span className='text-accent'>Pulse</span>
              </span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ color: 'var(--text-muted)' }}
            className='hover:text-[var(--text)] transition-colors shrink-0'>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <NavList showLabels={sidebarOpen} />
        <UserFooter showLabels={sidebarOpen} collapsedToggle={!sidebarOpen} />
      </aside>

      {/* Main column */}
      <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>

        {/* Mobile top bar -- just branding now, navigation lives in the
            bottom nav instead */}
        <div className='flex lg:hidden items-center justify-between px-4 py-3 shrink-0'
          style={{ background: 'var(--dark-secondary)', borderBottom: '1px solid var(--border)' }}>
          <div className='flex items-center gap-2'>
            <PulseLogo size={26} />
            <span className='font-bold' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>EduPulse</span>
          </div>
          <ThemeToggle variant='icon' />
        </div>

        {/* Content scrolls independently between the top bar and bottom nav */}
        <main className='flex-1 overflow-auto p-4 sm:p-6 pb-20 lg:pb-6'>
          <Outlet />
        </main>

        {/* Mobile bottom nav -- fixed to the viewport bottom, always visible.
            3 primary tabs plus "More" for everything else. */}
        <nav className='flex lg:hidden items-center justify-around px-2 py-2.5 shrink-0'
          style={{ background: 'var(--dark-secondary)', borderTop: '1px solid var(--border)' }}>
          {primaryMobile.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className='flex flex-col items-center gap-1 px-3 py-1'>
              {({ isActive }) => (
                <>
                  <span className='relative'>
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                    {to === '/alerts' && alertBadge > 0 && (
                      <span className='absolute -top-1 -right-1.5 rounded-full' style={{ width: 7, height: 7, background: 'var(--danger)', border: '1.5px solid var(--dark-secondary)' }} />
                    )}
                  </span>
                  <span className='text-[10px]' style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)', fontWeight: isActive ? 600 : 500 }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button onClick={() => setMoreOpen(true)} className='flex flex-col items-center gap-1 px-3 py-1'>
            <MoreHorizontal size={20} strokeWidth={1.8} style={{ color: moreOpen ? 'var(--primary)' : 'var(--text-muted)' }} />
            <span className='text-[10px]' style={{ color: moreOpen ? 'var(--primary)' : 'var(--text-muted)', fontWeight: moreOpen ? 600 : 500 }}>More</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
