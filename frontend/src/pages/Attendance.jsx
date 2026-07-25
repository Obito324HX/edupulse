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

  // Staff roles see a per-student attendance summary for the selected
  // course (present/absent/late counts + rate) -- students see their own
  // flat list of records. The old version called /attendance/student/<id>
  // with the LOGGED-IN STAFF MEMBER'S OWN id regardless of role, which
  // meant this view never actually showed any student's attendance.
  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance', user?.id, selectedCourse],
    queryFn: () => canMark
      ? api.get(`/attendance/course/${selectedCourse}/summary`).then(r => r.data.summary)
      : api.get(`/attendance/student/${user?.id}`).then(r => r.data.attendance),
    enabled: canMark ? !!selectedCourse : true
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

  const getRateColor = (rate) => {
    if (rate >= 90) return 'var(--success)'
    if (rate >= 75) return 'var(--warning)'
    return 'var(--danger)'
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
          <option value=''>Select a course to view attendance</option>
          {courses?.map(c => <option key={c.id} value={c.id}>{c.name} - {c.code}</option>)}
        </select>
      )}

      <div className='table-wrap'>
        {canMark ? (
          <>
            <div className='t-head'>
              <span style={{ flex: 2 }}>Student</span>
              <span style={{ flex: 0.8 }}>Present</span>
              <span style={{ flex: 0.8 }}>Absent</span>
              <span style={{ flex: 0.8 }}>Late</span>
              <span style={{ width: 90, textAlign: 'right' }}>Rate</span>
            </div>
            {!selectedCourse ? (
              <div className='text-center py-8 text-sm' style={{ color: 'var(--text-muted)' }}>Select a course to view attendance</div>
            ) : isLoading ? (
              <div className='text-center py-8 text-sm' style={{ color: 'var(--text-muted)' }}>Loading...</div>
            ) : !records || records.length === 0 ? (
              <div className='text-center py-8 text-sm' style={{ color: 'var(--text-muted)' }}>No attendance records for this course yet</div>
            ) : records?.map(row => (
              <div key={row.student_id} className='t-row'>
                <span style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }} className='truncate'>
                  <div className='avatar' style={{ width: 30, height: 30, fontSize: 10.5 }}>
                    {(row.student_name || '—').split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }} className='truncate'>{row.student_name || '—'}</span>
                </span>
                <span style={{ flex: 0.8, color: 'var(--success)' }} className='font-mono-data text-sm'>{row.present}</span>
                <span style={{ flex: 0.8, color: 'var(--danger)' }} className='font-mono-data text-sm'>{row.absent}</span>
                <span style={{ flex: 0.8, color: 'var(--warning)' }} className='font-mono-data text-sm'>{row.late}</span>
                <span style={{ width: 90, textAlign: 'right' }} className='font-mono-data font-semibold text-sm'>
                  <span style={{ color: getRateColor(row.attendance_rate) }}>{row.attendance_rate}%</span>
                </span>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className='t-head'>
              <span style={{ flex: 1 }}>Date</span>
              <span style={{ flex: 2 }}>Course</span>
              <span style={{ width: 90, textAlign: 'right' }}>Status</span>
            </div>
            {isLoading ? (
              <div className='text-center py-8 text-sm' style={{ color: 'var(--text-muted)' }}>Loading...</div>
            ) : !records || records.length === 0 ? (
              <div className='text-center py-8 text-sm' style={{ color: 'var(--text-muted)' }}>No attendance records</div>
            ) : records?.map(record => (
              <div key={record.id} className='t-row'>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>
                  {new Date(record.date).toLocaleDateString()}
                </span>
                <span style={{ flex: 2, fontSize: 13, color: 'var(--text-muted)' }} className='truncate'>
                  {record.course_name ? `${record.course_name} (${record.course_code})` : `Course #${record.course_id}`}
                </span>
                <span style={{ width: 90, textAlign: 'right' }}>
                  <span className='pill-status capitalize' style={getStatusStyle(record.status)}>
                    {record.status}
                  </span>
                </span>
              </div>
            ))}
          </>
        )}
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
