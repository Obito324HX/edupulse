import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Alerts() {
  const { user } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState('unresolved')
  const queryClient = useQueryClient()

  const isStaff = ['lecturer', 'institution_admin', 'super_admin'].includes(user?.role)

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts/').then(r => r.data.alerts)
  })

  const resolve = useMutation({
    mutationFn: (id) => api.put(`/alerts/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts'])
      queryClient.invalidateQueries(['alertStats'])
      toast.success('Alert resolved')
    }
  })

  const getSeverityStyle = (severity) => {
    if (severity === 'high') return { background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)' }
    if (severity === 'medium') return { background: 'color-mix(in srgb, var(--warning) 15%, transparent)', color: 'var(--warning)', border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)' }
    return { background: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' }
  }

  const filtered = data?.filter(a =>
    statusFilter === 'all' ? true :
    statusFilter === 'unresolved' ? !a.resolved :
    a.resolved
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const unresolvedCount = data?.filter(a => !a.resolved).length || 0
  const resolvedCount = data?.filter(a => a.resolved).length || 0

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Alerts</h1>
        <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>Academic early warning alerts</p>
      </div>

      {/* Filter chips */}
      <div className='flex items-center gap-2'>
        {[
          { id: 'unresolved', label: 'Unresolved', count: unresolvedCount },
          { id: 'resolved', label: 'Resolved', count: resolvedCount },
          { id: 'all', label: 'All', count: data?.length || 0 },
        ].map(chip => (
          <button key={chip.id} onClick={() => setStatusFilter(chip.id)}
            className='flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors'
            style={{
              background: statusFilter === chip.id ? 'var(--primary)' : 'var(--dark-secondary)',
              color: statusFilter === chip.id ? 'var(--on-primary)' : 'var(--text-muted)',
              border: `1px solid ${statusFilter === chip.id ? 'transparent' : 'var(--border)'}`
            }}>
            {chip.label} <span className='font-mono-data'>{chip.count}</span>
          </button>
        ))}
      </div>

      <div className='flex flex-col gap-4'>
        {isLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : filtered?.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16'>
            <CheckCircle size={48} style={{ color: 'var(--success)' }} />
            <p className='mt-3 font-medium' style={{ color: 'var(--text)' }}>
              {statusFilter === 'unresolved' ? 'No active alerts' : statusFilter === 'resolved' ? 'Nothing resolved yet' : 'No alerts'}
            </p>
            <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>
              {statusFilter === 'unresolved' ? 'All students are performing well' : ' '}
            </p>
          </div>
        ) : filtered?.map(alert => (
          <div key={alert.id} className='rounded-2xl p-6 flex items-start justify-between gap-4'
            style={getSeverityStyle(alert.severity)}>
            <div className='flex items-start gap-4 min-w-0'>
              <AlertTriangle size={20} className='shrink-0 mt-0.5' />
              <div className='min-w-0'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <p className='font-medium text-sm capitalize'>{alert.alert_type.replace('_', ' ')}</p>
                  {isStaff && (alert.student_name || alert.course_name) && (
                    <span className='text-xs opacity-70'>
                      · {alert.student_name || 'Unknown student'}{alert.course_name ? ` — ${alert.course_name}` : ''}
                    </span>
                  )}
                </div>
                <p className='text-sm mt-1 opacity-80'>{alert.message}</p>
                <p className='text-xs mt-2 opacity-60'>{new Date(alert.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            {!alert.resolved && isStaff && (
              <button onClick={() => resolve.mutate(alert.id)}
                className='px-4 py-2 rounded-xl text-xs font-medium text-on-primary flex-shrink-0'
                style={{ background: 'var(--success)' }}>
                Resolve
              </button>
            )}
            {alert.resolved && (
              <span className='px-3 py-1 rounded-full text-xs font-medium flex-shrink-0'
                style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' }}>
                Resolved
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
