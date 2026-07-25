import { useAuthStore } from '../store/authStore'
import { User, Mail, Phone, Shield, KeyRound, SlidersHorizontal } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [thresholds, setThresholds] = useState(null)

  const { data: institution } = useQuery({
    queryKey: ['institution', user?.institution_id],
    queryFn: () => api.get(`/institutions/${user.institution_id}`).then(r => r.data.institution),
    enabled: user?.role === 'institution_admin' && !!user?.institution_id
  })

  useEffect(() => {
    if (institution && !thresholds) {
      setThresholds({
        grade_alert_threshold: institution.grade_alert_threshold,
        grade_alert_severe_threshold: institution.grade_alert_severe_threshold,
        absence_alert_threshold: institution.absence_alert_threshold,
        absence_alert_severe_threshold: institution.absence_alert_severe_threshold
      })
    }
  }, [institution])

  const saveThresholds = useMutation({
    mutationFn: (data) => api.put(`/institutions/${user.institution_id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['institution', user.institution_id])
      toast.success('Alert thresholds updated')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update thresholds')
  })

  return (
    <div className='flex flex-col gap-5 max-w-2xl'>
      <div className='page-head'>
        <div>
          <div className='eyebrow'>Account</div>
          <h1>Profile</h1>
          <p>Your account details</p>
        </div>
      </div>

      <div className='card' style={{ padding: 28 }}>
        <div className='flex items-center gap-5 mb-7'>
          <div className='w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0'
            style={{ background: 'linear-gradient(135deg, var(--primary-bright), var(--secondary))', color: 'var(--on-primary)', fontFamily: "'Fraunces', serif" }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <h2 className='text-xl font-semibold' style={{ color: 'var(--text)' }}>{user?.first_name} {user?.last_name}</h2>
            <span className='pill pill-good capitalize mt-1 inline-block'>{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
        <div className='flex flex-col gap-3'>
          {[
            { icon: User, label: 'Full name', value: `${user?.first_name} ${user?.last_name}` },
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: Phone, label: 'Phone', value: user?.phone || 'Not provided' },
            { icon: Shield, label: 'Role', value: user?.role?.replace('_', ' ') },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className='flex items-center gap-4 p-4 rounded-[14px]' style={{ background: 'var(--dark)', border: '1px solid var(--border-soft)' }}>
              <div className='w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0' style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                <Icon size={17} style={{ color: 'var(--primary-bright)' }} />
              </div>
              <div className='min-w-0'>
                <p className='text-xs' style={{ color: 'var(--text-faint)' }}>{label}</p>
                <p className='text-sm font-medium capitalize truncate' style={{ color: 'var(--text)' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {user?.role === 'institution_admin' && institution?.join_code && (
        <div className='card panel'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0' style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
              <KeyRound size={17} style={{ color: 'var(--primary-bright)' }} />
            </div>
            <div>
              <h3 style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15 }}>Institution join code</h3>
              <p className='text-xs' style={{ color: 'var(--text-faint)' }}>Share this with students and parents so they can register under {institution.name}</p>
            </div>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(institution.join_code); toast.success('Join code copied!') }}
            className='mono' style={{ padding: '9px 16px', borderRadius: 10, background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 15, letterSpacing: '0.1em' }}
          >
            {institution.join_code}
          </button>
        </div>
      )}

      {user?.role === 'institution_admin' && thresholds && (
        <div className='card panel'>
          <div className='flex items-center gap-3 mb-5'>
            <div className='w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0' style={{ background: 'color-mix(in srgb, var(--secondary) 15%, transparent)' }}>
              <SlidersHorizontal size={17} style={{ color: 'var(--secondary-bright)' }} />
            </div>
            <div>
              <h3 style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15 }}>Alert thresholds</h3>
              <p className='text-xs' style={{ color: 'var(--text-faint)' }}>Control when EduPulse flags a student for low grades or poor attendance</p>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4 mb-2'>
            <div className='field'>
              <label>Flag grade below (%)</label>
              <input type='number' min={0} max={100} value={thresholds.grade_alert_threshold}
                onChange={e => setThresholds({ ...thresholds, grade_alert_threshold: Number(e.target.value) })} />
            </div>
            <div className='field'>
              <label>Mark high severity below (%)</label>
              <input type='number' min={0} max={100} value={thresholds.grade_alert_severe_threshold}
                onChange={e => setThresholds({ ...thresholds, grade_alert_severe_threshold: Number(e.target.value) })} />
            </div>
            <div className='field'>
              <label>Flag absence rate above (%)</label>
              <input type='number' min={0} max={100} value={thresholds.absence_alert_threshold}
                onChange={e => setThresholds({ ...thresholds, absence_alert_threshold: Number(e.target.value) })} />
            </div>
            <div className='field'>
              <label>Mark high severity above (%)</label>
              <input type='number' min={0} max={100} value={thresholds.absence_alert_severe_threshold}
                onChange={e => setThresholds({ ...thresholds, absence_alert_severe_threshold: Number(e.target.value) })} />
            </div>
          </div>

          <button onClick={() => saveThresholds.mutate(thresholds)} disabled={saveThresholds.isPending} className='btn-primary mt-4 disabled:opacity-60'>
            {saveThresholds.isPending ? 'Saving…' : 'Save thresholds'}
          </button>
        </div>
      )}
    </div>
  )
}
