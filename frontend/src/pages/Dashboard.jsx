import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import { Users, BookOpen, Bell, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className='rounded-2xl p-6' style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
      <div className='flex items-center justify-between mb-4'>
        <span className='text-sm font-medium' style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div className='w-10 h-10 rounded-xl flex items-center justify-center' style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <p className='text-3xl font-bold' style={{ color: 'var(--text)' }}>{value}</p>
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

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {['institution_admin', 'super_admin', 'lecturer'].includes(user?.role) && (
          <StatCard icon={Users} label='Total Students' value={students?.length || 0} color='var(--primary)' />
        )}
        <StatCard icon={BookOpen} label='Courses' value={courses?.length || 0} color='var(--secondary)' />
        <StatCard icon={Bell} label='Unread Notifications' value={unreadCount} color='var(--warning)' />
        {['institution_admin', 'super_admin'].includes(user?.role) && (
          <>
            <StatCard icon={AlertTriangle} label='Unresolved Alerts' value={alertStats?.unresolved_alerts || 0} color='var(--danger)' />
          </>
        )}
      </div>

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
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
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
