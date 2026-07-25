import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import PulseWordmark from '../components/PulseWordmark'
import PulseECG from '../components/PulseECG'
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
    <div className='min-h-screen flex flex-col lg:flex-row relative' style={{ background: 'var(--dark)' }}>

      <div className='absolute top-5 right-5 z-10'>
        <ThemeToggle variant='icon' />
      </div>

      {/* Brand panel -- desktop only. On mobile this collapses away entirely
          and the form panel below becomes the whole screen, same as before. */}
      <div className='hidden lg:flex lg:w-[46%] flex-col justify-between p-14 relative overflow-hidden'
        style={{
          background: `radial-gradient(70% 55% at 15% 8%, color-mix(in srgb, var(--secondary) 24%, transparent), transparent 60%), radial-gradient(60% 50% at 90% 95%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 60%), var(--dark)`
        }}>
        <div className='relative z-10'>
          <PulseWordmark size={22} />
        </div>

        <div className='relative z-10 max-w-md'>
          <div className='mb-4'>
            <PulseECG w={80} h={16} />
          </div>
          <h1 className='font-semibold leading-tight mb-4' style={{ color: 'var(--text)', fontSize: '2.5rem', fontFamily: "'Fraunces', serif" }}>
            Every student's progress, finally in one place.
          </h1>
          <p className='text-sm leading-relaxed' style={{ color: 'var(--text-muted)', maxWidth: 360 }}>
            Attendance, grades, and alerts across every institution you run — without chasing five spreadsheets to find who needs help.
          </p>
        </div>

        <div className='relative z-10 text-xs' style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} EduPulse
        </div>
      </div>

      {/* Form panel -- top-anchored on mobile (matches the blueprint's
          layout and avoids the dead blank space vertical centering left
          on tall phone viewports), still centered on desktop */}
      <div className='flex-1 flex items-start lg:items-center justify-center p-4 sm:p-6 lg:p-12 pt-14 lg:pt-12 overflow-y-auto'>
        <div className='w-full max-w-md'>

          {/* Brand mark -- mobile only, since the brand panel above covers this on desktop.
              Matches the blueprint: a compact wordmark row, then a proof-card near the
              top instead of a full-width logo tile. */}
          <div className='lg:hidden mb-8'>
            <div className='mb-6'>
              <PulseWordmark size={22} />
            </div>
            <div className='proof-card' style={{
              background: `radial-gradient(90% 130% at 0% 0%, color-mix(in srgb, var(--secondary) 20%, transparent), transparent 60%), var(--dark-secondary)`
            }}>
              <PulseECG w={56} h={14} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  Every student's progress, in one place
                </p>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  Attendance, grades, and alerts across every institution you run
                </p>
              </div>
            </div>
          </div>

          <div className='mb-6'>
            <h2 className='text-2xl font-semibold mb-1' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>
              Welcome back
            </h2>
            <p className='text-sm' style={{ color: 'var(--text-muted)' }}>
              Sign in to your institution's account
            </p>
          </div>

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

            <div className='text-right -mt-2'>
              <Link to='/forgot-password' style={{ color: 'var(--text-muted)' }} className='text-sm hover:underline'>
                Forgot password?
              </Link>
            </div>

            <button type='submit' disabled={loading}
              className='pill-btn-primary w-full mt-2 disabled:opacity-60'>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className='flex items-center justify-between gap-3 mt-6 px-4 py-3 rounded-xl'
            style={{ background: 'color-mix(in srgb, var(--secondary) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--secondary) 25%, transparent)' }}>
            <p className='text-xs' style={{ color: 'var(--text)' }}>
              New institution? <span className='font-medium'>Register with a join code</span>
            </p>
            <Link to='/register' style={{ color: 'var(--secondary)' }} className='text-xs font-semibold whitespace-nowrap'>
              Get started →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
