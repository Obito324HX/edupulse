import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
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
    <div className='min-h-screen flex items-center justify-center p-4'
      style={{ background: 'var(--dark)' }}>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4'
            style={{ background: 'var(--primary)' }}>
            <span className='text-white font-bold text-2xl'>EP</span>
          </div>
          <h1 className='text-3xl font-bold' style={{ color: 'var(--text)' }}>EduPulse</h1>
          <p className='mt-1' style={{ color: 'var(--text-muted)' }}>
            Keep your students' academic heartbeat strong
          </p>
        </div>
        <div className='rounded-2xl p-8' style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
          <h2 className='text-xl font-semibold mb-6' style={{ color: 'var(--text)' }}>Sign in</h2>
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <div>
              <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Email</label>
              <input type='email' value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder='you@example.com' required
                className='w-full px-4 py-3 rounded-xl text-sm outline-none transition-all'
                style={{ background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Password</label>
              <input type='password' value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder='••••••••' required
                className='w-full px-4 py-3 rounded-xl text-sm outline-none transition-all'
                style={{ background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <button type='submit' disabled={loading}
              className='w-full py-3 rounded-xl font-semibold text-sm text-white transition-all mt-2'
              style={{ background: loading ? 'var(--border)' : 'var(--primary)' }}>
              {loading ? 'Signing in...' : 'Sign in'}
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
