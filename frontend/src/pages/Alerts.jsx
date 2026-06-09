import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Alerts() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts/').then(r => r.data.alerts)
  })

  const resolve = useMutation({
    mutationFn: (id) => api.put(`/alerts/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts'])
      toast.success('Alert resolved')
    }
  })

  const getSeverityStyle = (severity) => {
    if (severity === 'high') return { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }
    if (severity === 'medium') return { background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40' }
    return { background: '#6366f120', color: '#6366f1', border: '1px solid #6366f140' }
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Alerts</h1>
        <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>Academic early warning alerts</p>
      </div>
      <div className='flex flex-col gap-4'>
        {isLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : data?.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16'>
            <CheckCircle size={48} style={{ color: 'var(--success)' }} />
            <p className='mt-3 font-medium' style={{ color: 'var(--text)' }}>No active alerts</p>
            <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>All students are performing well</p>
          </div>
        ) : data?.map(alert => (
          <div key={alert.id} className='rounded-2xl p-6 flex items-start justify-between gap-4'
            style={getSeverityStyle(alert.severity)}>
            <div className='flex items-start gap-4'>
              <AlertTriangle size={20} />
              <div>
                <p className='font-medium text-sm capitalize'>{alert.alert_type.replace('_', ' ')}</p>
                <p className='text-sm mt-1 opacity-80'>{alert.message}</p>
                <p className='text-xs mt-2 opacity-60'>{new Date(alert.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            {!alert.resolved && ['lecturer', 'institution_admin', 'super_admin'].includes(user?.role) && (
              <button onClick={() => resolve.mutate(alert.id)}
                className='px-4 py-2 rounded-xl text-xs font-medium text-white flex-shrink-0'
                style={{ background: 'var(--success)' }}>
                Resolve
              </button>
            )}
            {alert.resolved && (
              <span className='px-3 py-1 rounded-full text-xs font-medium'
                style={{ background: '#22c55e20', color: '#22c55e' }}>
                Resolved
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
