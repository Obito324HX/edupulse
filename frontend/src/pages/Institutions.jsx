import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import PulseRing from '../components/PulseRing'

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

  const statusPill = { active: 'pill-good', trial: 'pill-warn' }

  return (
    <div className='flex flex-col gap-5'>
      <div className='page-head'>
        <div>
          <div className='eyebrow'>Network</div>
          <h1>Institutions</h1>
          <p>{data?.length ?? 0} institution{data?.length === 1 ? '' : 's'} on EduPulse.</p>
        </div>
        <button onClick={() => setShowModal(true)} className='btn-primary'><Plus size={16} /> Add institution</button>
      </div>

      <div className='flex flex-col gap-3.5'>
        {isLoading ? (
          <p style={{ color: 'var(--text-faint)' }}>Loading…</p>
        ) : data?.length === 0 ? (
          <p style={{ color: 'var(--text-faint)' }}>No institutions yet</p>
        ) : data?.map(inst => (
          <div key={inst.id} className='card inst-card'>
            <PulseRing value={inst.pulse ?? null} size={68} stroke={6} showLabel={false}
              color={inst.pulse != null ? (inst.pulse > 85 ? 'var(--success)' : inst.pulse > 70 ? 'var(--primary-bright)' : 'var(--warning)') : undefined} />
            <div className='info'>
              <h4>{inst.name}</h4>
              <div className='loc'>{inst.location || 'No location'} · {inst.email}</div>
              <div className='mini-stats'>
                <div><b>{inst.student_count ?? 0}</b><span>Students</span></div>
                <div><b>{inst.course_count ?? 0}</b><span>Courses</span></div>
              </div>
              <div className='flex items-center gap-2 mt-3 flex-wrap'>
                <span className={`pill ${statusPill[inst.subscription_status] || 'pill-neutral'}`} style={{ textTransform: 'capitalize' }}>{inst.subscription_status}</span>
                {inst.join_code && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(inst.join_code); toast.success('Join code copied!') }}
                    className='mono' title='Click to copy — share with students/parents to join this institution'
                    style={{ padding: '5px 12px', borderRadius: 999, background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12.5, letterSpacing: '0.08em' }}
                  >
                    {inst.join_code}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className='modal-backdrop' onClick={() => setShowModal(false)}>
          <div className='modal-card' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>Add institution</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className='flex flex-col gap-4'>
              {[
                { key: 'name', label: 'Institution name', placeholder: 'Evelyn Hone College' },
                { key: 'email', label: 'Email', placeholder: 'info@institution.edu.zm' },
                { key: 'location', label: 'Location', placeholder: 'Lusaka, Zambia' },
                { key: 'phone', label: 'Phone', placeholder: '+260 97 000 0000' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className='field'>
                  <label>{label}</label>
                  <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
                </div>
              ))}
              <button onClick={() => create.mutate(form)} disabled={create.isPending} className='btn-primary w-full'>
                {create.isPending ? 'Creating…' : 'Create institution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
