import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { ArrowLeft, MailCheck } from 'lucide-react'
import PulseLogo from '../components/PulseLogo'
import ThemeToggle from '../components/ThemeToggle'
import FloatingInput from '../components/FloatingInput'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
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

          {sent ? (
            <div className='text-center'>
              <div className='mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center'
                style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' }}>
                <MailCheck size={26} />
              </div>
              <h2 className='text-xl font-semibold mb-2' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>
                Check your email
              </h2>
              <p className='text-sm' style={{ color: 'var(--text-muted)' }}>
                If an account exists for <span style={{ color: 'var(--text)' }}>{email}</span>, we've sent a link to reset your password. It expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              <h2 className='text-xl font-semibold mb-1' style={{ color: 'var(--text)', fontFamily: "'Fraunces', serif" }}>
                Reset your password
              </h2>
              <p className='text-sm mb-6' style={{ color: 'var(--text-muted)' }}>
                Enter your email and we'll send you a link to get back in
              </p>

              <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                <FloatingInput
                  label='Email'
                  type='email'
                  autoComplete='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />

                <button type='submit' disabled={loading}
                  className='pill-btn-primary w-full mt-2 disabled:opacity-60'>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}

          <p className='text-center text-sm mt-6 flex items-center justify-center gap-1.5'
            style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} />
            <Link to='/login' style={{ color: 'var(--primary)' }} className='font-medium hover:underline'>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
