import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import { Building2 } from 'lucide-react'

export default function Institutions() {
  const { data, isLoading } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => api.get('/institutions/').then(r => r.data.institutions)
  })

  const getStatusStyle = (status) => {
    if (status === 'active') return { background: '#22c55e20', color: '#22c55e' }
    if (status === 'trial') return { background: '#f59e0b20', color: '#f59e0b' }
    return { background: '#ef444420', color: '#ef4444' }
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Institutions</h1>
        <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>All institutions on EduPulse</p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {isLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : data?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No institutions yet</p>
        ) : data?.map(inst => (
          <div key={inst.id} className='rounded-2xl p-6'
            style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
            <div className='w-12 h-12 rounded-xl flex items-center justify-center mb-4'
              style={{ background: 'var(--primary)20' }}>
              <Building2 size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className='font-semibold' style={{ color: 'var(--text)' }}>{inst.name}</h3>
            <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>{inst.location || 'No location'}</p>
            <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>{inst.email}</p>
            <div className='mt-4'>
              <span className='px-3 py-1 rounded-full text-xs font-medium capitalize'
                style={getStatusStyle(inst.subscription_status)}>
                {inst.subscription_status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
