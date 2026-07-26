import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  ClipboardList, Bell, LogOut, Building2, Menu, X, Search
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import PulseWordmark from './PulseWordmark'
import ThemeToggle from './ThemeToggle'
import CommandPalette from './CommandPalette'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  // Mobile: the rail is an off-canvas drawer, toggled from the topbar.
  const [railOpen, setRailOpen] = useState(false)
  // Command palette (⌘K / Ctrl+K)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(open => !open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Unresolved alert count for the nav badge. Only institution_admin and
  // super_admin get a stats endpoint at all -- students/lecturers just see
  // the Alerts page itself, no badge.
  const { data: alertStats } = useQuery({
    queryKey: ['alertStats'],
    queryFn: () => api.get('/alerts/stats').then(r => r.data.stats),
    enabled: ['institution_admin', 'super_admin'].includes(user?.role)
  })
  const alertBadge = alertStats?.unresolved_alerts || 0

  const handleLogout = async () => {
    // Best-effort: revoke the token server-side so it can't be reused if
    // it leaked. Still log the user out locally even if this call fails
    // (e.g. they're offline) -- a failed revoke shouldn't trap someone
    // who's trying to leave.
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  const sections = [
    {
      label: 'Overview',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['all'] },
      ]
    },
    {
      label: 'Manage',
      items: [
        { to: '/students', icon: Users, label: 'Students', roles: ['super_admin', 'institution_admin', 'lecturer'] },
        { to: '/courses', icon: BookOpen, label: 'Courses', roles: ['all'] },
        { to: '/grades', icon: GraduationCap, label: 'Grades', roles: ['all'] },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance', roles: ['all'] },
        { to: '/alerts', icon: Bell, label: 'Alerts', roles: ['all'], badge: alertBadge },
      ]
    },
    {
      label: 'Network',
      items: [
        { to: '/institutions', icon: Building2, label: 'Institutions', roles: ['super_admin'] },
      ]
    },
  ].map(section => ({
    ...section,
    items: section.items.filter(i => i.roles.includes('all') || i.roles.includes(user?.role))
  })).filter(section => section.items.length > 0)

  return (
    <div className='flex h-screen overflow-hidden' style={{ background: 'var(--dark)' }}>

      {/* Off-canvas backdrop, mobile only */}
      {railOpen && (
        <div className='fixed inset-0 z-40 lg:hidden' style={{ background: 'var(--overlay)' }} onClick={() => setRailOpen(false)} />
      )}

      {/* Rail -- always full-width with labels on desktop, off-canvas drawer on mobile */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[236px] shrink-0 flex flex-col py-[22px] px-3.5 transition-transform duration-300 lg:translate-x-0 ${railOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--dark-secondary)', borderRight: '1px solid var(--border-soft)' }}
      >
        <div className='flex items-center justify-between px-1 mb-[26px]'>
          <div className='min-w-0'>
            <PulseWordmark size={19} />
          </div>
          <button onClick={() => setRailOpen(false)} style={{ color: 'var(--text-muted)' }} className='lg:hidden shrink-0'>
            <X size={18} />
          </button>
        </div>

        <nav className='flex-1 flex flex-col overflow-y-auto'>
          {sections.map(section => (
            <div key={section.label}>
              <div className='px-2.5 pt-3.5 pb-1.5 text-[10.5px] uppercase tracking-wider' style={{ color: 'var(--text-faint)' }}>
                {section.label}
              </div>
              {section.items.map(({ to, icon: Icon, label, badge }) => (
                <NavLink key={to} to={to} onClick={() => setRailOpen(false)}
                  className='flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-colors duration-150'
                  style={({ isActive }) => ({
                    background: isActive ? 'color-mix(in srgb, var(--primary) 14%, transparent)' : undefined,
                    color: isActive ? 'var(--primary-bright)' : 'var(--text-muted)'
                  })}>
                  {({ isActive }) => (
                    <>
                      <Icon size={17} strokeWidth={isActive ? 2.1 : 1.8} className='shrink-0' style={{ opacity: .9 }} />
                      <span className='text-[14px] flex-1' style={{ fontWeight: isActive ? 600 : 500 }}>{label}</span>
                      {badge > 0 && (
                        <span className='badge-count' style={{ marginLeft: 'auto' }}>{badge > 99 ? '99+' : badge}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className='pt-3.5 mt-auto' style={{ borderTop: '1px solid var(--border-soft)' }}>
          <NavLink to='/profile' className='flex items-center gap-2.5 px-2 py-2 rounded-[10px] min-w-0 transition-colors hover:bg-white/[0.04]'>
            <div className='w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 font-semibold text-xs'
              style={{ background: 'linear-gradient(135deg, var(--primary-bright), var(--secondary))', color: 'var(--on-primary)', fontFamily: "'Fraunces', serif" }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className='min-w-0'>
              <p className='text-[13px] font-semibold truncate' style={{ color: 'var(--text)' }}>{user?.first_name} {user?.last_name}</p>
              <p className='text-[11.5px] capitalize truncate' style={{ color: 'var(--text-faint)' }}>{user?.role?.replace('_', ' ')}</p>
            </div>
          </NavLink>
          <div className='flex items-center gap-1 mt-1'>
            <div className='flex-1'><ThemeToggle collapsed={false} /></div>
            <button onClick={handleLogout} title='Log out'
              className='w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-colors hover:bg-white/[0.04]'
              style={{ color: 'var(--text-muted)' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>

        {/* Topbar -- sticky, holds the mobile rail toggle + search pill + bell + avatar */}
        <div className='flex items-center gap-3 sm:gap-4 px-4 sm:px-7 shrink-0' style={{ height: 68, borderBottom: '1px solid var(--border-soft)' }}>
          <button onClick={() => setRailOpen(true)} className='lg:hidden shrink-0' style={{ color: 'var(--text-muted)' }}>
            <Menu size={20} />
          </button>
          <button onClick={() => setPaletteOpen(true)} className='cmdk'>
            <Search size={15} />
            <span className='truncate'>Search students, courses, alerts…</span>
            <kbd className='hidden sm:inline'>⌘K</kbd>
          </button>
          <div className='ml-auto flex items-center gap-3 shrink-0'>
            <button onClick={() => navigate('/alerts')} className='icon-btn'>
              {alertBadge > 0 && <span className='dot' />}
              <Bell size={17} />
            </button>
            <NavLink to='/profile' className='w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 font-semibold text-xs'
              style={{ background: 'linear-gradient(135deg, var(--primary-bright), var(--secondary))', color: 'var(--on-primary)', fontFamily: "'Fraunces', serif" }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </NavLink>
          </div>
        </div>

        {/* Content */}
        <main className='flex-1 overflow-auto p-4 sm:p-7'>
          <div className='max-w-[1320px]'>
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
