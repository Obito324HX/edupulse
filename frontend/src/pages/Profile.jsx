import { useAuthStore } from '../store/authStore'
import { User, Mail, Phone, Shield, KeyRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuthStore()

  const { data: institution } = useQuery({
    queryKey: ['institution', user?.institution_id],
    queryFn: () => api.get(`/institutions/${user.institution_id}`).then(r => r.data.institution),
    enabled: user?.role === 'institution_admin' && !!user?.institution_id
  })

  return (
    <div className='flex flex-col gap-6 max-w-2xl'>
      <div>
        <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Profile</h1>
        <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>Your account details</p>
      </div>
      <div className='rounded-2xl p-8' style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
        <div className='flex items-center gap-6 mb-8'>
          <div className='w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-on-primary'
            style={{ background: 'var(--primary)' }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <h2 className='text-xl font-bold' style={{ color: 'var(--text)' }}>
              {user?.first_name} {user?.last_name}
            </h2>
            <span className='px-3 py-1 rounded-full text-xs font-medium capitalize mt-1 inline-block'
              style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)' }}>
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className='flex flex-col gap-4'>
          {[
            { icon: User, label: 'Full Name', value: `${user?.first_name} ${user?.last_name}` },
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: Phone, label: 'Phone', value: user?.phone || 'Not provided' },
            { icon: Shield, label: 'Role', value: user?.role?.replace('_', ' ') },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className='flex items-center gap-4 p-4 rounded-xl'
              style={{ background: 'var(--dark)', border: '1px solid var(--border)' }}>
              <div className='w-10 h-10 rounded-xl flex items-center justify-center'
                style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                <Icon size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className='text-xs' style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className='text-sm font-medium capitalize' style={{ color: 'var(--text)' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {user?.role === 'institution_admin' && institution?.join_code && (
        <div className='rounded-2xl p-6' style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center'
              style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
              <KeyRound size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 className='font-semibold' style={{ color: 'var(--text)' }}>Institution join code</h3>
              <p className='text-xs' style={{ color: 'var(--text-muted)' }}>Share this with students and parents so they can register under {institution.name}</p>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(institution.join_code)
              toast.success('Join code copied!')
            }}
            className='flex items-center gap-2 px-4 py-2 rounded-lg font-mono-data text-base tracking-widest'
            style={{ background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {institution.join_code}
          </button>
        </div>
      )}
    </div>
  )
}
