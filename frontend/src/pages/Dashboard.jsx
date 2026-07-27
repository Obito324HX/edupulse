import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import { Users, BookOpen, Bell } from 'lucide-react'
import PulseRing from '../components/PulseRing'
import toast from 'react-hot-toast'
import { exportDashboardReport } from '../utils/exportReport'

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const severityPill = { high: 'pill-bad', medium: 'pill-warn', low: 'pill-good' }
const severityLabel = { high: 'High', medium: 'Medium', low: 'Low' }

export default function Dashboard() {
  const { user } = useAuthStore()
  const isAdmin = ['institution_admin', 'super_admin'].includes(user?.role)

  const { data: pulse } = useQuery({
    queryKey: ['pulse'],
    queryFn: () => api.get('/institutions/pulse').then(r => r.data),
    enabled: isAdmin
  })

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/users/students').then(r => r.data.students),
    enabled: ['institution_admin', 'super_admin', 'lecturer'].includes(user?.role)
  })

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses/').then(r => r.data.courses)
  })

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts/').then(r => r.data.alerts)
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/alerts/notifications').then(r => r.data.notifications)
  })

  const unreadCount = notifications?.filter(n => !n.read).length || 0
  const unresolvedAlerts = alerts?.filter(a => !a.resolved) || []
  const highSeverityCount = unresolvedAlerts.filter(a => a.severity === 'high').length
  const flaggedStudents = new Set(unresolvedAlerts.map(a => a.student_id)).size
  const recentAlerts = [...unresolvedAlerts]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4)
  const recentNotifications = notifications?.slice(0, 4) || []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const heroHeadline = !isAdmin
    ? "Here's what's happening today"
    : flaggedStudents > 0
      ? `Strong term so far — ${flaggedStudents} student${flaggedStudents === 1 ? '' : 's'} need attention`
      : 'Everything is on track — no open alerts'

  return (
    <div className='flex flex-col gap-5'>
      <div className='page-head'>
        <div>
          <div className='eyebrow'>Overview{user?.institution_name ? ` · ${user.institution_name}` : ''}</div>
          <h1>{greeting}, {user?.first_name}</h1>
          <p>Here's the institutional pulse as of today, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
        </div>
        <button
          onClick={() => {
            try {
              exportDashboardReport({
                user, isAdmin, pulse, courses, unresolvedAlerts,
                flaggedStudents, highSeverityCount, unreadCount, notifications
              })
            } catch {
              toast.error('Could not generate the report — try again.')
            }
          }}
          className='btn-ghost'
        >
          Export report
        </button>
      </div>

      {isAdmin && (
        <div className='card hero-card'>
          <PulseRing
            value={pulse?.pulse ?? null}
            size={132}
            stroke={10}
            label={user?.role === 'super_admin' ? 'Network pulse' : 'Institution pulse'}
          />
          <div className='hcopy'>
            <div className='eyebrow'>Institutional pulse</div>
            <h2>{heroHeadline}</h2>
            <p>A composite of average grades, attendance, and open alerts — updated in real time as lecturers submit results.</p>
            <div className='hero-stats'>
              <div className='s'><b style={{ color: 'var(--success)' }}>{pulse?.attendance_rate != null ? `${pulse.attendance_rate}%` : '—'}</b><span>Attendance</span></div>
              <div className='s'><b style={{ color: 'var(--primary-bright)' }}>{pulse?.grade_average != null ? pulse.grade_average : '—'}</b><span>Average mark</span></div>
              <div className='s'><b style={{ color: 'var(--danger)' }}>{highSeverityCount}</b><span>High-risk alerts</span></div>
              <div className='s'><b>{students?.length ?? 0}</b><span>Students</span></div>
            </div>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {(user?.role === 'lecturer' || isAdmin) && (
          <div className='card kpi'>
            <div className='top'>
              <span className='top-label'>{isAdmin ? 'Active courses' : 'My courses'}</span>
              <div className='ic' style={{ background: 'color-mix(in srgb, var(--secondary) 15%, transparent)' }}>
                <BookOpen size={16} style={{ color: 'var(--secondary-bright)' }} />
              </div>
            </div>
            <div className='num'>{courses?.length ?? 0}</div>
            <div className='lbl'>&nbsp;</div>
          </div>
        )}
        {isAdmin && (
          <div className='card kpi'>
            <div className='top'>
              <span className='top-label'>Flagged students</span>
              <div className='ic' style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)' }}>
                <Users size={16} style={{ color: 'var(--danger)' }} />
              </div>
            </div>
            <div className='num'>{flaggedStudents}</div>
            <div className='lbl'>with an open alert</div>
          </div>
        )}
        <div className='card kpi'>
          <div className='top'>
            <span className='top-label'>Unread notifications</span>
            <div className='ic' style={{ background: 'color-mix(in srgb, var(--warning) 15%, transparent)' }}>
              <Bell size={16} style={{ color: 'var(--warning)' }} />
            </div>
          </div>
          <div className='num'>{unreadCount}</div>
          <div className='lbl'>&nbsp;</div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div className='card panel'>
          <div className='phead'>
            <h3>Recent alerts</h3>
            <a href='/alerts'>View all</a>
          </div>
          {recentAlerts.length === 0 && <p className='text-sm' style={{ color: 'var(--text-faint)' }}>No open alerts right now.</p>}
          {recentAlerts.map(a => (
            <div key={a.id} className='list-row'>
              <span className={`pill ${severityPill[a.severity]}`}>{severityLabel[a.severity]}</span>
              <div className='txt'>
                <b>{a.student_name || a.message}</b>
                <span>{a.course_name || a.alert_type.replace('_', ' ')}</span>
              </div>
              <div className='rt' style={{ color: 'var(--text-faint)', fontSize: 11.5 }}>{timeAgo(a.created_at)}</div>
            </div>
          ))}
        </div>

        <div className='card panel'>
          <div className='phead'>
            <h3>Recent notifications</h3>
          </div>
          {recentNotifications.length === 0 && <p className='text-sm' style={{ color: 'var(--text-faint)' }}>You're all caught up.</p>}
          {recentNotifications.map(n => (
            <div key={n.id} className='list-row'>
              <div className='w-2 h-2 rounded-full shrink-0' style={{ background: n.read ? 'var(--border)' : 'var(--primary)' }} />
              <div className='txt'>
                <b>{n.title}</b>
                <span>{n.message}</span>
              </div>
              <div className='rt' style={{ color: 'var(--text-faint)', fontSize: 11.5 }}>{timeAgo(n.created_at)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
