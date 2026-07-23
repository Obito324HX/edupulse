import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import PulseLogo from '../components/PulseLogo'
import ThemeToggle from '../components/ThemeToggle'
import FloatingInput from '../components/FloatingInput'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords don\u2019t match')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: password })
      setDone(true)
      toast.success('Password reset successfully')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong. Try again.')
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
            <PulseLogo size={56} />
          </div>
          <h1 className='text-4xl font-semibold' style={{ color: 'var(--text)' }}>
            Edu<span className='text-accent'>Pulse</span>
          </h1>
        </div>

        <div className='rounded-3xl p-8 shadow-2xl'
          style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>

          {!token ? (
            <div className='text-center'>
              <h2 className='text-xl font-semibold mb-2' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>
                Invalid link
              </h2>
              <p className='text-sm mb-6' style={{ color: 'var(--text-muted)' }}>
                This password reset link is missing or malformed. Request a new one below.
              </p>
              <Link to='/forgot-password' className='pill-btn-primary w-full inline-block'>
                Request new link
              </Link>
            </div>
          ) : done ? (
            <div className='text-center'>
              <div className='mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center'
                style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' }}>
                <CheckCircle2 size={26} />
              </div>
              <h2 className='text-xl font-semibold mb-2' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>
                Password reset
              </h2>
              <p className='text-sm' style={{ color: 'var(--text-muted)' }}>
                Taking you to sign in…
              </p>
            </div>
          ) : (
            <>
              <h2 className='text-xl font-semibold mb-1' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>
                Choose a new password
              </h2>
              <p className='text-sm mb-6' style={{ color: 'var(--text-muted)' }}>
                Make it at least 8 characters
              </p>

              <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                <FloatingInput
                  label='New password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  rightSlot={
                    <button type='button' onClick={() => setShowPassword(v => !v)}
                      style={{ color: 'var(--text-muted)' }} tabIndex={-1}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
                <FloatingInput
                  label='Confirm new password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />

                <button type='submit' disabled={loading}
                  className='pill-btn-primary w-full mt-2 disabled:opacity-60'>
                  {loading ? 'Resetting…' : 'Reset password'}
                </button>
              </form>
            </>
          )}

          {!done && (
            <p className='text-center text-sm mt-6' style={{ color: 'var(--text-muted)' }}>
              <Link to='/login' style={{ color: 'var(--primary)' }} className='font-medium hover:underline'>
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
