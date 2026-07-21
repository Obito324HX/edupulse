import { useAuthStore } from '../store/authStore'
import { User, Mail, Phone, Shield } from 'lucide-react'

export default function Profile() {
  const { user } = useAuthStore()

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
              style={{ background: 'color-mix(in srgb, var(--primary) 16%, transparent)', color: 'var(--primary)' }}>
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
                style={{ background: 'color-mix(in srgb, var(--primary) 16%, transparent)' }}>
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
    </div>
  )
}
