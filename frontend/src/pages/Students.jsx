import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { Search, UserPlus, X, ShieldPlus } from 'lucide-react'
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

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts/').then(r => r.data.alerts),
    enabled: ['institution_admin', 'super_admin', 'lecturer'].includes(user?.role)
  })

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses/').then(r => r.data.courses)
  })

  const { data: institutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => api.get('/institutions/').then(r => r.data.institutions),
    enabled: user?.role === 'super_admin'
  })

  // A student's ring color reflects the worst unresolved alert against
  // them -- high severity anywhere makes the whole ring red, medium makes
  // it amber, otherwise green (no open alerts at all).
  const riskByStudent = {}
  ;(alerts || []).filter(a => !a.resolved).forEach(a => {
    const rank = { high: 3, medium: 2, low: 1 }
    if (!riskByStudent[a.student_id] || rank[a.severity] > rank[riskByStudent[a.student_id]]) {
      riskByStudent[a.student_id] = a.severity
    }
  })
  const ringClass = { high: 'bad', medium: 'warn', low: 'warn' }
  const statusPill = { high: 'pill-bad', medium: 'pill-warn', low: 'pill-warn' }
  const statusLabel = { high: 'Flagged', medium: 'Watch', low: 'Watch' }

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
      statusFilter === 'flagged' ? !!riskByStudent[s.id] : true
    return matchesSearch && matchesStatus
  })

  const flaggedCount = data?.filter(s => !!riskByStudent[s.id]).length || 0

  return (
    <div className='flex flex-col gap-5'>
      <div className='page-head'>
        <div>
          <div className='eyebrow'>Manage</div>
          <h1>Students</h1>
          <p>{data?.length ?? 0} students across {courses?.length ?? 0} courses.</p>
        </div>
        {['institution_admin', 'super_admin'].includes(user?.role) && (
          <button onClick={() => setShowStaffModal(true)} className='btn-primary'>
            <ShieldPlus size={16} /> Add staff
          </button>
        )}
      </div>

      <div className='toolbar'>
        <div className='search-input'>
          <Search size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search by name or email…' />
        </div>
        {[
          { id: 'all', label: 'All', count: data?.length || 0 },
          { id: 'active', label: 'Active', count: data?.filter(s => s.is_active).length || 0 },
          { id: 'flagged', label: 'Flagged', count: flaggedCount },
        ].map(chip => (
          <button key={chip.id} onClick={() => setStatusFilter(chip.id)} className={`chip${statusFilter === chip.id ? ' on' : ''}`}>
            {chip.label} · <span className='font-mono-data'>{chip.count}</span>
          </button>
        ))}
      </div>

      <div className='card' style={{ overflowX: 'auto' }}>
        <table className='tbl'>
          <thead>
            <tr><th>Student</th><th>Contact</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className='text-center py-8' style={{ color: 'var(--text-faint)' }}>Loading…</td></tr>
            ) : filtered?.length === 0 ? (
              <tr><td colSpan={4} className='text-center py-8' style={{ color: 'var(--text-faint)' }}>
                {statusFilter !== 'all' || search ? 'No students match this filter' : 'No students found'}
              </td></tr>
            ) : filtered?.map(student => {
              const risk = riskByStudent[student.id]
              return (
                <tr key={student.id}>
                  <td>
                    <div className='name-cell'>
                      <div className={`avatar-ring ${risk ? ringClass[risk] : 'good'}`}>
                        <div className='avatar'>{student.first_name[0]}{student.last_name[0]}</div>
                      </div>
                      <div className='n'><b>{student.first_name} {student.last_name}</b><span>{student.is_active ? 'Active' : 'Inactive'}</span></div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-faint)' }}>{student.email}</td>
                  <td>
                    <span className={`pill ${risk ? statusPill[risk] : 'pill-good'}`}>{risk ? statusLabel[risk] : 'On track'}</span>
                  </td>
                  <td>
                    <button onClick={() => { setSelectedStudent(student); setShowEnrollModal(true) }}
                      className='icon-btn' title='Enroll in a course'>
                      <UserPlus size={15} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showEnrollModal && (
        <div className='modal-backdrop' onClick={() => setShowEnrollModal(false)}>
          <div className='modal-card' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>
                Enroll {selectedStudent?.first_name} {selectedStudent?.last_name}
              </h2>
              <button onClick={() => setShowEnrollModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className='flex flex-col gap-4'>
              <div className='field'>
                <label>Select course</label>
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                  <option value=''>Select a course</option>
                  {courses?.map(c => <option key={c.id} value={c.id}>{c.name} - {c.code}</option>)}
                </select>
              </div>
              <button onClick={() => enroll.mutate({ courseId: selectedCourse, studentId: selectedStudent.id })}
                disabled={enroll.isPending || !selectedCourse}
                className='btn-primary w-full'>
                {enroll.isPending ? 'Enrolling…' : 'Enroll student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStaffModal && (
        <div className='modal-backdrop' onClick={() => setShowStaffModal(false)}>
          <div className='modal-card' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>Add staff account</h2>
              <button onClick={() => setShowStaffModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className='flex flex-col gap-3'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='field'>
                  <label>First name</label>
                  <input value={staffForm.first_name} onChange={e => setStaffForm({ ...staffForm, first_name: e.target.value })} placeholder='First name' />
                </div>
                <div className='field'>
                  <label>Last name</label>
                  <input value={staffForm.last_name} onChange={e => setStaffForm({ ...staffForm, last_name: e.target.value })} placeholder='Last name' />
                </div>
              </div>
              <div className='field'>
                <label>Email</label>
                <input value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} type='email' placeholder='you@institution.edu.zm' />
              </div>
              <div className='field'>
                <label>Phone (optional)</label>
                <input value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} placeholder='Phone' />
              </div>
              <div className='field'>
                <label>Temporary password</label>
                <input value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} type='password' placeholder='••••••••' />
              </div>
              <div className='field'>
                <label>Role</label>
                <select value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}>
                  <option value='lecturer'>Lecturer</option>
                  <option value='institution_admin'>Institution admin</option>
                </select>
              </div>
              {user?.role === 'super_admin' && (
                <div className='field'>
                  <label>Institution</label>
                  <select value={staffForm.institution_id} onChange={e => setStaffForm({ ...staffForm, institution_id: e.target.value })}>
                    <option value=''>Select an institution…</option>
                    {institutions?.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
              )}
              <button onClick={() => createStaff.mutate(staffForm)}
                disabled={createStaff.isPending || !staffForm.first_name || !staffForm.last_name || !staffForm.email || !staffForm.password || (user?.role === 'super_admin' && !staffForm.institution_id)}
                className='btn-primary w-full mt-2 disabled:opacity-60'>
                {createStaff.isPending ? 'Creating…' : 'Create staff account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
