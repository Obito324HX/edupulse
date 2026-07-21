import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { Building2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Institutions() {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', location: '', phone: '' })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => api.get('/institutions/').then(r => r.data.institutions)
  })

  const create = useMutation({
    mutationFn: (data) => api.post('/institutions/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['institutions'])
      toast.success('Institution created!')
      setShowModal(false)
      setForm({ name: '', email: '', location: '', phone: '' })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create institution')
  })

  const getStatusStyle = (status) => {
    if (status === 'active') return { background: 'color-mix(in srgb, var(--success) 16%, transparent)', color: 'var(--success)' }
    if (status === 'trial') return { background: 'color-mix(in srgb, var(--warning) 16%, transparent)', color: 'var(--warning)' }
    return { background: 'color-mix(in srgb, var(--danger) 16%, transparent)', color: 'var(--danger)' }
  }

  const inputStyle = { background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Institutions</h1>
          <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>All institutions on EduPulse</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-on-primary'
          style={{ background: 'var(--primary)' }}>
          <Plus size={18} /> Add Institution
        </button>
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
              style={{ background: 'color-mix(in srgb, var(--primary) 16%, transparent)' }}>
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

      {/* Modal */}
      {showModal && (
        <div className='fixed inset-0 flex items-center justify-center z-50 p-4'
          style={{ background: 'var(--overlay)' }}>
          <div className='w-full max-w-md rounded-2xl p-8'
            style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>Add Institution</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className='flex flex-col gap-4'>
              {[
                { key: 'name', label: 'Institution Name', placeholder: 'Evelyn Hone College' },
                { key: 'email', label: 'Email', placeholder: 'info@institution.edu.zm' },
                { key: 'location', label: 'Location', placeholder: 'Lusaka, Zambia' },
                { key: 'phone', label: 'Phone', placeholder: '+260 97 000 0000' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className='w-full px-4 py-3 rounded-xl text-sm outline-none'
                    style={inputStyle} />
                </div>
              ))}
              <button onClick={() => create.mutate(form)}
                disabled={create.isPending}
                className='w-full py-3 rounded-xl font-semibold text-sm text-on-primary mt-2'
                style={{ background: create.isPending ? 'var(--border)' : 'var(--primary)' }}>
                {create.isPending ? 'Creating...' : 'Create Institution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
