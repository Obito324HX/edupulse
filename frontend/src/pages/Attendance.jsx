import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Attendance() {
  const { user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [form, setForm] = useState({ student_id: '', course_id: '', status: 'present', date: new Date().toISOString().split('T')[0] })
  const queryClient = useQueryClient()

  const canMark = ['lecturer', 'institution_admin', 'super_admin'].includes(user?.role)

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance', user?.id, selectedCourse],
    queryFn: () => canMark && selectedCourse
      ? api.get(`/attendance/student/${user?.id}?course_id=${selectedCourse}`).then(r => r.data.attendance)
      : api.get(`/attendance/student/${user?.id}`).then(r => r.data.attendance)
  })

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses/').then(r => r.data.courses)
  })

  const { data: students } = useQuery({
    queryKey: ['courseStudents', form.course_id],
    queryFn: () => api.get(`/courses/${form.course_id}/students`).then(r => r.data.students),
    enabled: !!form.course_id
  })

  const markAttendance = useMutation({
    mutationFn: (data) => api.post('/attendance/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance'])
      toast.success('Attendance marked!')
      setShowModal(false)
      setForm({ student_id: '', course_id: '', status: 'present', date: new Date().toISOString().split('T')[0] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to mark attendance')
  })

  const getStatusStyle = (status) => {
    if (status === 'present') return { background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' }
    if (status === 'late') return { background: 'color-mix(in srgb, var(--warning) 15%, transparent)', color: 'var(--warning)' }
    return { background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)' }
  }

  const inputStyle = { background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Attendance</h1>
          <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>
            {canMark ? 'Mark and manage attendance' : 'Your attendance records'}
          </p>
        </div>
        {canMark && (
          <button onClick={() => setShowModal(true)}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-on-primary'
            style={{ background: 'var(--primary)' }}>
            <Plus size={18} /> Mark Attendance
          </button>
        )}
      </div>

      {canMark && (
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          className='w-full max-w-xs px-4 py-3 rounded-xl text-sm outline-none'
          style={inputStyle}>
          <option value=''>Filter by course</option>
          {courses?.map(c => <option key={c.id} value={c.id}>{c.name} - {c.code}</option>)}
        </select>
      )}

      <div className='rounded-2xl overflow-hidden' style={{ border: '1px solid var(--border)' }}>
        <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr style={{ background: 'var(--dark-secondary)' }}>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Date</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Course</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className='text-center py-8' style={{ color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : !records || records.length === 0 ? (
              <tr><td colSpan={3} className='text-center py-8' style={{ color: 'var(--text-muted)' }}>No attendance records</td></tr>
            ) : records?.map((record, i) => (
              <tr key={record.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--dark)' : 'var(--dark-secondary)' }}>
                <td className='px-6 py-4 text-sm' style={{ color: 'var(--text)' }}>
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className='px-6 py-4 text-sm' style={{ color: 'var(--text-muted)' }}>Course #{record.course_id}</td>
                <td className='px-6 py-4'>
                  <span className='px-3 py-1 rounded-full text-xs font-medium capitalize'
                    style={getStatusStyle(record.status)}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showModal && (
        <div className='fixed inset-0 flex items-center justify-center z-50 p-4'
          style={{ background: 'var(--overlay)' }}>
          <div className='w-full max-w-md rounded-2xl p-8'
            style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>Mark Attendance</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className='flex flex-col gap-4'>
              <div>
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Course</label>
                <select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle}>
                  <option value=''>Select course</option>
                  {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Student</label>
                <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle}>
                  <option value=''>Select student</option>
                  {students?.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Date</label>
                <input type='date' value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle} />
              </div>
              <div>
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle}>
                  <option value='present'>Present</option>
                  <option value='absent'>Absent</option>
                  <option value='late'>Late</option>
                </select>
              </div>
              <button onClick={() => markAttendance.mutate(form)}
                disabled={markAttendance.isPending}
                className='w-full py-3 rounded-xl font-semibold text-sm text-on-primary mt-2'
                style={{ background: markAttendance.isPending ? 'var(--border)' : 'var(--primary)' }}>
                {markAttendance.isPending ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
