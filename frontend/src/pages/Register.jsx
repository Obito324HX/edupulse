import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    password: '', role: 'student', phone: ''
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

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

  const inputStyle = {
    background: 'var(--dark)',
    border: '1px solid var(--border)',
    color: 'var(--text)'
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
          <p className='mt-1' style={{ color: 'var(--text-muted)' }}>Create your account</p>
        </div>
        <div className='rounded-2xl p-8' style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
          <h2 className='text-xl font-semibold mb-6' style={{ color: 'var(--text)' }}>Sign up</h2>
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>First Name</label>
                <input type='text' value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })}
                  placeholder='John' required
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none'
                  style={inputStyle} />
              </div>
              <div>
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Last Name</label>
                <input type='text' value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })}
                  placeholder='Doe' required
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none'
                  style={inputStyle} />
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Email</label>
              <input type='email' value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder='you@example.com' required
                className='w-full px-4 py-3 rounded-xl text-sm outline-none'
                style={inputStyle} />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Phone</label>
              <input type='text' value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder='+260 97 000 0000'
                className='w-full px-4 py-3 rounded-xl text-sm outline-none'
                style={inputStyle} />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Role</label>
              <select value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className='w-full px-4 py-3 rounded-xl text-sm outline-none'
                style={inputStyle}>
                <option value='student'>Student</option>
                <option value='lecturer'>Lecturer</option>
                <option value='institution_admin'>Institution Admin</option>
                <option value='parent'>Parent/Guardian</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Password</label>
              <input type='password' value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder='••••••••' required
                className='w-full px-4 py-3 rounded-xl text-sm outline-none'
                style={inputStyle} />
            </div>
            <button type='submit' disabled={loading}
              className='w-full py-3 rounded-xl font-semibold text-sm text-white transition-all mt-2'
              style={{ background: loading ? 'var(--border)' : 'var(--primary)' }}>
              {loading ? 'Creating account...' : 'Create account'}
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
