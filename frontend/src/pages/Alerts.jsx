import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import { CheckCircle } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

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

  const filtered = data?.filter(a =>
    statusFilter === 'all' ? true :
    statusFilter === 'unresolved' ? !a.resolved :
    a.resolved
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const unresolvedCount = data?.filter(a => !a.resolved).length || 0
  const resolvedCount = data?.filter(a => a.resolved).length || 0
  const highCount = data?.filter(a => !a.resolved && a.severity === 'high').length || 0

  return (
    <div className='flex flex-col gap-5'>
      <div className='page-head'>
        <div>
          <div className='eyebrow'>Manage</div>
          <h1>Alerts</h1>
          <p>{unresolvedCount} open alert{unresolvedCount === 1 ? '' : 's'}{highCount > 0 ? ` — ${highCount} high severity need review` : ''}.</p>
        </div>
      </div>

      <div className='toolbar'>
        {[
          { id: 'unresolved', label: 'Unresolved', count: unresolvedCount },
          { id: 'resolved', label: 'Resolved', count: resolvedCount },
          { id: 'all', label: 'All', count: data?.length || 0 },
        ].map(chip => (
          <button key={chip.id} onClick={() => setStatusFilter(chip.id)} className={`chip${statusFilter === chip.id ? ' on' : ''}`}>
            {chip.label} · <span className='font-mono-data'>{chip.count}</span>
          </button>
        ))}
      </div>

      <div className='flex flex-col gap-3'>
        {isLoading ? (
          <p style={{ color: 'var(--text-faint)' }}>Loading…</p>
        ) : filtered?.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16'>
            <CheckCircle size={40} style={{ color: 'var(--success)' }} />
            <p className='mt-3 font-medium' style={{ color: 'var(--text)' }}>
              {statusFilter === 'unresolved' ? 'No active alerts' : statusFilter === 'resolved' ? 'Nothing resolved yet' : 'No alerts'}
            </p>
            <p className='text-sm mt-1' style={{ color: 'var(--text-faint)' }}>
              {statusFilter === 'unresolved' ? 'All students are performing well' : ' '}
            </p>
          </div>
        ) : filtered?.map(alert => (
          <div key={alert.id} className='card alert-card'>
            <div className={`sev ${alert.severity}`}></div>
            <div className='body'>
              <div className='top'>
                <b>{alert.alert_type.replace('_', ' ')}</b>
                <span className={`pill ${alert.severity === 'high' ? 'pill-bad' : alert.severity === 'medium' ? 'pill-warn' : 'pill-good'}`}>
                  {alert.severity === 'high' ? 'High' : alert.severity === 'medium' ? 'Medium' : 'Low'}
                </span>
                {alert.resolved && <span className='pill pill-neutral'>Resolved</span>}
              </div>
              <p>
                {isStaff && (alert.student_name || alert.course_name) ? `${alert.student_name || 'Unknown student'}${alert.course_name ? ` — ${alert.course_name}` : ''} · ` : ''}
                {alert.message}
              </p>
              <div className='meta'>{timeAgo(alert.created_at)}</div>
            </div>
            {!alert.resolved && isStaff && (
              <button onClick={() => resolve.mutate(alert.id)} className='btn-ghost' style={{ padding: '9px 16px', fontSize: 12.5 }}>Resolve</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
