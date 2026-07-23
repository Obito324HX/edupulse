import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import { Users, BookOpen, Bell, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PulseRing from '../components/PulseRing'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className='rounded-2xl p-6' style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
      <div className='flex items-center justify-between mb-4'>
        <span className='text-sm font-medium' style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div className='w-10 h-10 rounded-xl flex items-center justify-center' style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <p className='text-3xl font-bold font-mono-data' style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}

function Reading({ label, value, icon: Icon, color }) {
  return (
    <div className='flex items-center gap-3 py-2.5' style={{ borderBottom: '1px solid var(--border)' }}>
      <div className='w-9 h-9 rounded-lg flex items-center justify-center shrink-0' style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <span className='text-[13px] flex-1' style={{ color: 'var(--text)' }}>{label}</span>
      <span className='font-mono-data text-sm font-semibold' style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: alertStats } = useQuery({
    queryKey: ['alertStats'],
    queryFn: () => api.get('/alerts/stats').then(r => r.data.stats),
    enabled: ['institution_admin', 'super_admin'].includes(user?.role)
  })

  const { data: pulse } = useQuery({
    queryKey: ['pulse'],
    queryFn: () => api.get('/institutions/pulse').then(r => r.data),
    enabled: ['institution_admin', 'super_admin'].includes(user?.role)
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

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/alerts/notifications').then(r => r.data.notifications)
  })

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  const sampleData = [
    { month: 'Jan', average: 65 },
    { month: 'Feb', average: 70 },
    { month: 'Mar', average: 68 },
    { month: 'Apr', average: 74 },
    { month: 'May', average: 72 },
    { month: 'Jun', average: 78 },
  ]

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>
          Welcome back, {user?.first_name} 👋
        </h1>
        <p className='mt-1 text-sm' style={{ color: 'var(--text-muted)' }}>
          Here's what's happening across your institution today.
        </p>
      </div>

      {/* Pulse hero — institution_admin sees their school's score,
          super_admin sees the network-wide score across every institution */}
      {['institution_admin', 'super_admin'].includes(user?.role) && (
        <div className='rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6'
          style={{
            background: `radial-gradient(90% 130% at 0% 0%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 60%), var(--dark-secondary)`,
            border: '1px solid var(--border)'
          }}>
          <PulseRing
            value={pulse?.pulse ?? null}
            size={140}
            stroke={10}
            label={user?.role === 'super_admin' ? 'Network pulse' : 'Institution pulse'}
            sub={pulse?.pulse != null ? (pulse.pulse >= 75 ? 'Healthy' : pulse.pulse >= 50 ? 'Watch closely' : 'Needs attention') : undefined}
          />
          <div className='flex-1 flex flex-col w-full'>
            <p className='text-xs mb-1' style={{ color: 'var(--text-muted)' }}>
              {pulse?.pulse != null
                ? 'A composite of average grades, attendance, and open alerts.'
                : 'Once grades and attendance start coming in, this fills in automatically.'}
            </p>
            <div className='flex flex-col'>
              <Reading label='Students' value={students?.length ?? 0} icon={Users} color='var(--secondary)' />
              <Reading label='Courses' value={courses?.length ?? 0} icon={BookOpen} color='var(--primary)' />
              <Reading label='Unread notifications' value={unreadCount} icon={Bell} color='var(--warning)' />
              <div className='flex items-center gap-3 pt-2.5'>
                <div className='w-9 h-9 rounded-lg flex items-center justify-center shrink-0' style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)' }}>
                  <AlertTriangle size={15} style={{ color: 'var(--danger)' }} />
                </div>
                <span className='text-[13px] flex-1' style={{ color: 'var(--text)' }}>Open alerts</span>
                <span className='font-mono-data text-sm font-semibold' style={{ color: 'var(--danger)' }}>{alertStats?.unresolved_alerts ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats — non-admin roles (students, lecturers) don't get the pulse
          hero above, so this is their only overview. Admin roles already
          see Students/Courses/Alerts in the hero, so this stays limited to
          what isn't duplicated there. */}
      {!['institution_admin', 'super_admin'].includes(user?.role) && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {user?.role === 'lecturer' && (
            <StatCard icon={Users} label='Total Students' value={students?.length || 0} color='var(--primary)' />
          )}
          <StatCard icon={BookOpen} label='Courses' value={courses?.length || 0} color='var(--secondary)' />
          <StatCard icon={Bell} label='Unread Notifications' value={unreadCount} color='var(--warning)' />
        </div>
      )}

      {/* Charts and Alerts */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Performance Chart */}
        <div className='lg:col-span-2 rounded-2xl p-6' style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
          <h2 className='text-lg font-semibold mb-6' style={{ color: 'var(--text)' }}>Performance Trend</h2>
          <ResponsiveContainer width='100%' height={250}>
            <LineChart data={sampleData}>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
              <XAxis dataKey='month' stroke='var(--text-muted)' tick={{ fontSize: 12 }} />
              <YAxis stroke='var(--text-muted)' tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Line type='monotone' dataKey='average' stroke='var(--primary)' strokeWidth={2} dot={{ fill: 'var(--primary)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Notifications */}
        <div className='rounded-2xl p-6' style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
          <h2 className='text-lg font-semibold mb-4' style={{ color: 'var(--text)' }}>Recent Notifications</h2>
          <div className='flex flex-col gap-3'>
            {notifications?.slice(0, 5).map(n => (
              <div key={n.id} className='flex items-start gap-3 p-3 rounded-xl'
                style={{ background: n.read ? 'transparent' : 'color-mix(in srgb, var(--primary) 10%, transparent)', border: '1px solid var(--border)' }}>
                <div className='w-2 h-2 rounded-full mt-1.5 flex-shrink-0'
                  style={{ background: n.read ? 'var(--border)' : 'var(--primary)' }} />
                <div>
                  <p className='text-sm font-medium' style={{ color: 'var(--text)' }}>{n.title}</p>
                  <p className='text-xs mt-0.5' style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                </div>
              </div>
            ))}
            {(!notifications || notifications.length === 0) && (
              <div className='flex flex-col items-center justify-center py-8'>
                <CheckCircle size={32} style={{ color: 'var(--success)' }} />
                <p className='text-sm mt-2' style={{ color: 'var(--text-muted)' }}>All caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
