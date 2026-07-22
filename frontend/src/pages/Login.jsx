import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import PulseLogo from '../components/PulseLogo'
import ThemeToggle from '../components/ThemeToggle'
import FloatingInput from '../components/FloatingInput'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.user, res.data.access_token)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
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

        {/* Brand mark */}
        <div className='text-center mb-8'>
          <div className='mx-auto mb-5 w-fit'>
            <PulseLogo size={56} />
          </div>
          <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-5'
            style={{
              background: 'color-mix(in srgb, var(--success) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
              color: 'var(--success)'
            }}>
            <span className='w-1.5 h-1.5 rounded-full' style={{ background: 'var(--success)' }} />
            Academic pulse, tracked live
          </div>
          <h1 className='text-4xl font-semibold' style={{ color: 'var(--text)' }}>
            Edu<span className='text-accent'>Pulse</span>
          </h1>
          <p className='mt-2 text-sm' style={{ color: 'var(--text-muted)' }}>
            Keep your students' academic heartbeat strong
          </p>
        </div>

        {/* Card */}
        <div className='rounded-3xl p-8 shadow-2xl'
          style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
          <h2 className='text-xl font-semibold mb-1' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>
            Welcome back
          </h2>
          <p className='text-sm mb-6' style={{ color: 'var(--text-muted)' }}>
            Please sign in to continue to your account
          </p>

          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <FloatingInput
              label='Email'
              type='email'
              autoComplete='email'
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
            <FloatingInput
              label='Password'
              type={showPassword ? 'text' : 'password'}
              autoComplete='current-password'
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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className='text-center text-sm mt-6' style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to='/register' style={{ color: 'var(--primary)' }} className='font-medium hover:underline'>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
