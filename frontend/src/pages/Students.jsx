import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { Users, Search, UserPlus, X, ShieldPlus, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export default function Students() {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [staffForm, setStaffForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', role: 'lecturer', institution_id: '' })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/users/students').then(r => r.data.students)
  })

  // Only staff roles get an alerts list to flag students against --
  // a student viewing their own roster (if that ever happens) wouldn't
  // have this endpoint available anyway.
  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts/').then(r => r.data.alerts),
    enabled: ['institution_admin', 'super_admin', 'lecturer'].includes(user?.role)
  })
  const flaggedIds = new Set((alerts || []).filter(a => !a.resolved).map(a => a.student_id))

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses/').then(r => r.data.courses)
  })

  const { data: institutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => api.get('/institutions/').then(r => r.data.institutions),
    enabled: user?.role === 'super_admin'
  })

  const enroll = useMutation({
    mutationFn: ({ courseId, studentId }) => api.post(`/courses/${courseId}/enroll`, { student_id: studentId }),
    onSuccess: () => {
      toast.success('Student enrolled successfully!')
      setShowEnrollModal(false)
      setSelectedStudent(null)
      setSelectedCourse('')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to enroll student')
  })

  const createStaff = useMutation({
    mutationFn: (data) => api.post('/users/staff', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Staff account created!')
      setShowStaffModal(false)
      setStaffForm({ first_name: '', last_name: '', email: '', phone: '', password: '', role: 'lecturer', institution_id: '' })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create staff account')
  })

  const filtered = data?.filter(s => {
    const matchesSearch = `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? s.is_active :
      statusFilter === 'flagged' ? flaggedIds.has(s.id) : true
    return matchesSearch && matchesStatus
  })

  const flaggedCount = data?.filter(s => flaggedIds.has(s.id)).length || 0

  const inputStyle = { background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Students</h1>
          <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>Manage and monitor all students</p>
        </div>
        {['institution_admin', 'super_admin'].includes(user?.role) && (
          <button onClick={() => setShowStaffModal(true)}
            className='pill-btn-primary flex items-center gap-2'>
            <ShieldPlus size={16} /> Add Staff
          </button>
        )}
      </div>

      {/* Search */}
      <div className='input-wrap' style={{ maxWidth: 320 }}>
        <Search size={14} className='leading' style={{ position: 'absolute', left: 13, color: 'var(--faint, var(--text-muted))' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder='Search students…'
          style={{
            width: '100%', padding: '11px 14px 11px 38px', borderRadius: 12, fontSize: 13.5,
            outline: 'none', background: 'var(--dark-secondary)', color: 'var(--text)', border: '1px solid var(--border)'
          }} />
      </div>

      {/* Filter chips */}
      <div className='flex items-center gap-2'>
        {[
          { id: 'all', label: 'All', count: data?.length || 0 },
          { id: 'active', label: 'Active', count: data?.filter(s => s.is_active).length || 0 },
          { id: 'flagged', label: 'Flagged', count: flaggedCount },
        ].map(chip => (
          <button key={chip.id} onClick={() => setStatusFilter(chip.id)}
            className={`chip${statusFilter === chip.id ? ' on' : ''}`}>
            {chip.label} · <span className='font-mono-data'>{chip.count}</span>
          </button>
        ))}
      </div>

      {/* Row list */}
      <div className='table-wrap'>
        <div className='t-head'>
          <span style={{ flex: 2 }}>Student</span>
          <span style={{ flex: 1.6 }}>Contact</span>
          <span style={{ width: 90, textAlign: 'right' }}>Status</span>
          <span style={{ width: 90, textAlign: 'right' }}>Actions</span>
        </div>
        {isLoading ? (
          <div className='text-center py-8 text-sm' style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered?.length === 0 ? (
          <div className='text-center py-8 text-sm' style={{ color: 'var(--text-muted)' }}>
            {statusFilter !== 'all' || search ? 'No students match this filter' : 'No students found'}
          </div>
        ) : filtered?.map(student => (
          <div key={student.id} className='t-row'>
            <span style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div className='avatar' style={{ width: 32, height: 32, fontSize: 11 }}>
                {student.first_name[0]}{student.last_name[0]}
              </div>
              <span className='truncate' style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                {student.first_name} {student.last_name}
              </span>
              {flaggedIds.has(student.id) && (
                <span title='Has an unresolved alert' className='pill-status flex items-center gap-1 shrink-0'
                  style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)' }}>
                  <AlertTriangle size={10} /> Flagged
                </span>
              )}
            </span>
            <span style={{ flex: 1.6, fontSize: 12.5, color: 'var(--text-muted)' }} className='truncate'>
              {student.email}
            </span>
            <span style={{ width: 90, textAlign: 'right' }}>
              <span className='pill-status' style={{
                background: student.is_active
                  ? 'color-mix(in srgb, var(--success) 15%, transparent)'
                  : 'color-mix(in srgb, var(--danger) 15%, transparent)',
                color: student.is_active ? 'var(--success)' : 'var(--danger)'
              }}>
                {student.is_active ? 'Active' : 'Inactive'}
              </span>
            </span>
            <span style={{ width: 90, textAlign: 'right' }}>
              <button onClick={() => { setSelectedStudent(student); setShowEnrollModal(true) }}
                className='icon-btn' title='Enroll in a course' style={{ marginLeft: 'auto' }}>
                <UserPlus size={15} style={{ color: 'var(--text-muted)' }} />
              </button>
            </span>
          </div>
        ))}
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className='fixed inset-0 flex items-center justify-center z-50 p-4'
          style={{ background: 'var(--overlay)' }}>
          <div className='w-full max-w-md rounded-2xl p-8'
            style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>
                Enroll {selectedStudent?.first_name} {selectedStudent?.last_name}
              </h2>
              <button onClick={() => setShowEnrollModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className='flex flex-col gap-4'>
              <div>
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Select Course</label>
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle}>
                  <option value=''>Select a course</option>
                  {courses?.map(c => <option key={c.id} value={c.id}>{c.name} - {c.code}</option>)}
                </select>
              </div>
              <button onClick={() => enroll.mutate({ courseId: selectedCourse, studentId: selectedStudent.id })}
                disabled={enroll.isPending || !selectedCourse}
                className='w-full py-3 rounded-xl font-semibold text-sm text-on-primary mt-2'
                style={{ background: !selectedCourse || enroll.isPending ? 'var(--border)' : 'var(--primary)' }}>
                {enroll.isPending ? 'Enrolling...' : 'Enroll Student'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Staff Modal */}
      {showStaffModal && (
        <div className='fixed inset-0 flex items-center justify-center z-50 p-4'
          style={{ background: 'var(--overlay)' }}>
          <div className='w-full max-w-md rounded-2xl p-8'
            style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>Add staff account</h2>
              <button onClick={() => setShowStaffModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className='flex flex-col gap-3'>
              <div className='grid grid-cols-2 gap-3'>
                <input value={staffForm.first_name} onChange={e => setStaffForm({ ...staffForm, first_name: e.target.value })}
                  placeholder='First name' className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle} />
                <input value={staffForm.last_name} onChange={e => setStaffForm({ ...staffForm, last_name: e.target.value })}
                  placeholder='Last name' className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle} />
              </div>
              <input value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                type='email' placeholder='Email' className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle} />
              <input value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                placeholder='Phone (optional)' className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle} />
              <input value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                type='password' placeholder='Temporary password' className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle} />
              <div>
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Role</label>
                <select value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle}>
                  <option value='lecturer'>Lecturer</option>
                  <option value='institution_admin'>Institution admin</option>
                </select>
              </div>
              {user?.role === 'super_admin' && (
                <div>
                  <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Institution</label>
                  <select value={staffForm.institution_id} onChange={e => setStaffForm({ ...staffForm, institution_id: e.target.value })}
                    className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle}>
                    <option value=''>Select an institution…</option>
                    {institutions?.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <button onClick={() => createStaff.mutate(staffForm)}
                disabled={createStaff.isPending || !staffForm.first_name || !staffForm.last_name || !staffForm.email || !staffForm.password || (user?.role === 'super_admin' && !staffForm.institution_id)}
                className='pill-btn-primary w-full mt-2 disabled:opacity-60'>
                {createStaff.isPending ? 'Creating…' : 'Create staff account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
