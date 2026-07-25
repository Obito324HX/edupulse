import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import {
  Search, LayoutDashboard, Users, BookOpen, GraduationCap,
  ClipboardList, Bell, User, Building2, CornerDownLeft
} from 'lucide-react'

const PAGES = [
  { id: 'page-dashboard', title: 'Dashboard', sub: 'Page', to: '/dashboard', icon: LayoutDashboard, roles: ['all'] },
  { id: 'page-students', title: 'Students', sub: 'Page', to: '/students', icon: Users, roles: ['super_admin', 'institution_admin', 'lecturer'] },
  { id: 'page-courses', title: 'Courses', sub: 'Page', to: '/courses', icon: BookOpen, roles: ['all'] },
  { id: 'page-grades', title: 'Grades', sub: 'Page', to: '/grades', icon: GraduationCap, roles: ['all'] },
  { id: 'page-attendance', title: 'Attendance', sub: 'Page', to: '/attendance', icon: ClipboardList, roles: ['all'] },
  { id: 'page-alerts', title: 'Alerts', sub: 'Page', to: '/alerts', icon: Bell, roles: ['all'] },
  { id: 'page-institutions', title: 'Institutions', sub: 'Page', to: '/institutions', icon: Building2, roles: ['super_admin'] },
  { id: 'page-profile', title: 'Profile', sub: 'Page', to: '/profile', icon: User, roles: ['all'] },
  { id: 'page-thresholds', title: 'Alert thresholds', sub: 'Settings · grade & absence flags', to: '/profile', icon: User, roles: ['institution_admin'] },
]

export default function CommandPalette({ open, onClose }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)

  const isStaff = ['super_admin', 'institution_admin', 'lecturer'].includes(user?.role)

  // Only fetched once the palette is actually open, and only for roles that
  // already have access to these endpoints -- no point paying for a fetch
  // a student can't use results from anyway.
  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/users/students').then(r => r.data.students),
    enabled: open && isStaff
  })
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses/').then(r => r.data.courses),
    enabled: open
  })
  const { data: institutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => api.get('/institutions/').then(r => r.data.institutions),
    enabled: open && user?.role === 'super_admin'
  })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pages = PAGES.filter(p => p.roles.includes('all') || p.roles.includes(user?.role))
      .map(p => ({ ...p, type: 'page' }))

    const studentResults = (students || []).map(s => ({
      id: `student-${s.id}`,
      title: `${s.first_name} ${s.last_name}`,
      sub: `Student${s.email ? ' · ' + s.email : ''}`,
      icon: Users,
      type: 'student',
      action: () => navigate(`/students?q=${encodeURIComponent(`${s.first_name} ${s.last_name}`)}`)
    }))

    const courseResults = (courses || []).map(c => ({
      id: `course-${c.id}`,
      title: `${c.name}${c.code ? ` — ${c.code}` : ''}`,
      sub: `Course${c.lecturer_name ? ' · ' + c.lecturer_name : ''}${c.enrolled_count != null ? ` · ${c.enrolled_count} enrolled` : ''}`,
      icon: BookOpen,
      type: 'course',
      action: () => navigate(`/courses?q=${encodeURIComponent(c.name)}`)
    }))

    const institutionResults = (institutions || []).map(i => ({
      id: `institution-${i.id}`,
      title: i.name,
      sub: `Institution${i.pulse != null ? ` · pulse ${i.pulse}` : ''}${i.student_count != null ? ` · ${i.student_count} students` : ''}`,
      icon: Building2,
      type: 'institution',
      action: () => navigate('/institutions')
    }))

    const all = [...pages, ...studentResults, ...courseResults, ...institutionResults]
    if (!q) return all.slice(0, 8)

    return all.filter(r => r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q)).slice(0, 20)
  }, [query, students, courses, institutions, user])

  useEffect(() => { setSelected(0) }, [results.length, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const activate = (result) => {
    if (!result) return
    if (result.action) result.action()
    else if (result.to) navigate(result.to)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      activate(results[selected])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-5'
      style={{ background: 'var(--overlay)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className='w-full max-w-[560px] rounded-2xl overflow-hidden'
        style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)', boxShadow: '0 40px 90px -30px rgba(0,0,0,0.7)' }}>

        <div className='flex items-center gap-2.5 px-4 py-3.5' style={{ borderBottom: '1px solid var(--border)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} className='shrink-0' />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Search students, courses, institutions…'
            autoComplete='off'
            className='flex-1 bg-transparent outline-none text-[15px]'
            style={{ color: 'var(--text)' }}
          />
          <span className='font-mono-data text-[10px] px-1.5 py-0.5 rounded shrink-0'
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Esc</span>
        </div>

        <div className='max-h-[320px] overflow-y-auto p-2'>
          {results.length === 0 ? (
            <div className='py-6 text-center text-sm' style={{ color: 'var(--text-muted)' }}>No matches</div>
          ) : results.map((r, i) => (
            <div key={r.id} onClick={() => activate(r)} onMouseEnter={() => setSelected(i)}
              className='flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer'
              style={{ background: i === selected ? 'color-mix(in srgb, var(--primary) 14%, transparent)' : 'transparent' }}>
              <div className='w-8 h-8 rounded-lg flex items-center justify-center shrink-0' style={{ background: 'var(--dark)' }}>
                <r.icon size={14} style={{ color: 'var(--primary)' }} />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-[13px] font-medium truncate' style={{ color: 'var(--text)' }}>{r.title}</p>
                <p className='text-[11px] truncate' style={{ color: 'var(--text-muted)' }}>{r.sub}</p>
              </div>
              {i === selected && <CornerDownLeft size={13} className='shrink-0' style={{ color: 'var(--text-muted)' }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
