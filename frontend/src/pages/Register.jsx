import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import PulseWordmark from '../components/PulseWordmark'
import ThemeToggle from '../components/ThemeToggle'
import FloatingInput from '../components/FloatingInput'

export default function Register() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    password: '', role: 'student', phone: '', join_code: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [institutionPreview, setInstitutionPreview] = useState(null) // { name } | 'invalid' | null
  const { login } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const code = form.join_code.trim()
    if (code.length < 4) {
      setInstitutionPreview(null)
      return
    }
    const timeout = setTimeout(() => {
      api.get(`/institutions/lookup/${code}`)
        .then(res => setInstitutionPreview(res.data.institution))
        .catch(() => setInstitutionPreview('invalid'))
    }, 400)
    return () => clearTimeout(timeout)
  }, [form.join_code])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.user, res.data.access_token)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4 sm:p-6 relative'
      style={{ background: 'var(--dark)' }}>
      <div className='absolute top-5 right-5'>
        <ThemeToggle variant='icon' />
      </div>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='mx-auto mb-5 w-fit'>
            <PulseWordmark size={34} />
          </div>
          <p className='mt-2 text-sm' style={{ color: 'var(--text-muted)' }}>Create your account</p>
        </div>
        <div className='rounded-3xl p-8 shadow-2xl' style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
          <h2 className='text-xl font-semibold mb-1' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>Sign up</h2>
          <p className='text-sm mb-6' style={{ color: 'var(--text-muted)' }}>
            Please fill in your details to get started
          </p>

          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <div className='grid grid-cols-2 gap-3'>
              <FloatingInput
                label='First name'
                autoComplete='given-name'
                value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })}
                required
              />
              <FloatingInput
                label='Last name'
                autoComplete='family-name'
                value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })}
                required
              />
            </div>
            <FloatingInput
              label='Email'
              type='email'
              autoComplete='email'
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
            <FloatingInput
              label='Phone'
              autoComplete='tel'
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
            <div>
              <FloatingInput
                label='Institution join code'
                value={form.join_code}
                onChange={e => setForm({ ...form, join_code: e.target.value.toUpperCase() })}
                required
              />
              {institutionPreview === 'invalid' && (
                <p className='flex items-center gap-1.5 text-xs mt-2' style={{ color: 'var(--danger)' }}>
                  <XCircle size={14} /> No institution found for that code
                </p>
              )}
              {institutionPreview && institutionPreview !== 'invalid' && (
                <p className='flex items-center gap-1.5 text-xs mt-2' style={{ color: 'var(--success)' }}>
                  <CheckCircle2 size={14} /> Joining {institutionPreview.name}
                </p>
              )}
              <p className='text-xs mt-2' style={{ color: 'var(--text-muted)' }}>
                Get this code from your institution's administrator.
              </p>
            </div>
            <FloatingInput
              label='Role'
              as='select'
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              <option value='student'>Student</option>
              <option value='parent'>Parent/Guardian</option>
            </FloatingInput>
            <FloatingInput
              label='Password'
              type={showPassword ? 'text' : 'password'}
              autoComplete='new-password'
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              rightSlot={
                <button type='button' onClick={() => setShowPassword(v => !v)}
                  style={{ color: 'var(--text-muted)' }} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <button type='submit' disabled={loading}
              className='pill-btn-primary w-full mt-2 disabled:opacity-60'>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className='text-center text-sm mt-6' style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to='/login' style={{ color: 'var(--primary)' }} className='font-medium hover:underline'>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
