import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { Users, Search, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Students() {
  const [search, setSearch] = useState('')
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/users/students').then(r => r.data.students)
  })

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses/').then(r => r.data.courses)
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

  const filtered = data?.filter(s =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const inputStyle = { background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Students</h1>
          <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>Manage and monitor all students</p>
        </div>
      </div>

      {/* Search */}
      <div className='flex items-center gap-3 px-4 py-3 rounded-xl'
        style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder='Search students...'
          className='flex-1 bg-transparent outline-none text-sm'
          style={{ color: 'var(--text)' }} />
      </div>

      {/* Table */}
      <div className='rounded-2xl overflow-hidden' style={{ border: '1px solid var(--border)' }}>
        <table className='w-full'>
          <thead>
            <tr style={{ background: 'var(--dark-secondary)' }}>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Name</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Email</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Phone</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Status</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className='text-center py-8' style={{ color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : filtered?.length === 0 ? (
              <tr><td colSpan={5} className='text-center py-8' style={{ color: 'var(--text-muted)' }}>No students found</td></tr>
            ) : filtered?.map((student, i) => (
              <tr key={student.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--dark)' : 'var(--dark-secondary)' }}>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-on-primary'
                      style={{ background: 'var(--primary)' }}>
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <span className='text-sm font-medium' style={{ color: 'var(--text)' }}>
                      {student.first_name} {student.last_name}
                    </span>
                  </div>
                </td>
                <td className='px-6 py-4 text-sm' style={{ color: 'var(--text-muted)' }}>{student.email}</td>
                <td className='px-6 py-4 text-sm' style={{ color: 'var(--text-muted)' }}>{student.phone || '—'}</td>
                <td className='px-6 py-4'>
                  <span className='px-3 py-1 rounded-full text-xs font-medium'
                    style={{
                      background: student.is_active
                        ? 'color-mix(in srgb, var(--success) 15%, transparent)'
                        : 'color-mix(in srgb, var(--danger) 15%, transparent)',
                      color: student.is_active ? 'var(--success)' : 'var(--danger)'
                    }}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className='px-6 py-4'>
                  <button onClick={() => { setSelectedStudent(student); setShowEnrollModal(true) }}
                    className='flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-on-primary'
                    style={{ background: 'var(--primary)' }}>
                    <UserPlus size={14} /> Enroll
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    </div>
  )
}
