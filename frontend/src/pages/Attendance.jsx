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

  const statusPill = { present: 'pill-good', late: 'pill-warn', absent: 'pill-bad' }
  const getRateColor = (rate) => rate >= 90 ? 'var(--success)' : rate >= 75 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div className='flex flex-col gap-5'>
      <div className='page-head'>
        <div>
          <div className='eyebrow'>Manage</div>
          <h1>Attendance</h1>
          <p>{canMark ? 'Mark and manage attendance' : 'Your attendance records'}</p>
        </div>
        {canMark && <button onClick={() => setShowModal(true)} className='btn-primary'><Plus size={16} /> Mark attendance</button>}
      </div>

      {canMark && (
        <div className='field' style={{ maxWidth: 320 }}>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            <option value=''>Select a course to view attendance</option>
            {courses?.map(c => <option key={c.id} value={c.id}>{c.name} - {c.code}</option>)}
          </select>
        </div>
      )}

      <div className='card' style={{ overflowX: 'auto' }}>
        {canMark ? (
          <table className='tbl'>
            <thead><tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Rate</th></tr></thead>
            <tbody>
              {!selectedCourse ? (
                <tr><td colSpan={5} className='text-center py-8' style={{ color: 'var(--text-faint)' }}>Select a course to view attendance</td></tr>
              ) : isLoading ? (
                <tr><td colSpan={5} className='text-center py-8' style={{ color: 'var(--text-faint)' }}>Loading…</td></tr>
              ) : !records || records.length === 0 ? (
                <tr><td colSpan={5} className='text-center py-8' style={{ color: 'var(--text-faint)' }}>No attendance records for this course yet</td></tr>
              ) : records.map(row => (
                <tr key={row.student_id}>
                  <td>
                    <div className='name-cell'>
                      <div className='avatar-ring good'><div className='avatar' style={{ width: 32, height: 32, fontSize: 11 }}>
                        {(row.student_name || '—').split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div></div>
                      <div className='n'><b>{row.student_name || '—'}</b></div>
                    </div>
                  </td>
                  <td className='mono' style={{ color: 'var(--success)' }}>{row.present}</td>
                  <td className='mono' style={{ color: 'var(--danger)' }}>{row.absent}</td>
                  <td className='mono' style={{ color: 'var(--warning)' }}>{row.late}</td>
                  <td className='mono' style={{ fontWeight: 700, color: getRateColor(row.attendance_rate) }}>{row.attendance_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className='tbl'>
            <thead><tr><th>Date</th><th>Course</th><th>Status</th></tr></thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3} className='text-center py-8' style={{ color: 'var(--text-faint)' }}>Loading…</td></tr>
              ) : !records || records.length === 0 ? (
                <tr><td colSpan={3} className='text-center py-8' style={{ color: 'var(--text-faint)' }}>No attendance records</td></tr>
              ) : records.map(record => (
                <tr key={record.id}>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td style={{ color: 'var(--text-faint)' }}>{record.course_name ? `${record.course_name} (${record.course_code})` : `Course #${record.course_id}`}</td>
                  <td><span className={`pill ${statusPill[record.status]}`} style={{ textTransform: 'capitalize' }}>{record.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className='modal-backdrop' onClick={() => setShowModal(false)}>
          <div className='modal-card' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>Mark attendance</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className='flex flex-col gap-4'>
              <div className='field'>
                <label>Course</label>
                <select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}>
                  <option value=''>Select course</option>
                  {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className='field'>
                <label>Student</label>
                <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
                  <option value=''>Select student</option>
                  {students?.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div className='field'>
                <label>Date</label>
                <input type='date' value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className='field'>
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value='present'>Present</option>
                  <option value='absent'>Absent</option>
                  <option value='late'>Late</option>
                </select>
              </div>
              <button onClick={() => markAttendance.mutate(form)} disabled={markAttendance.isPending} className='btn-primary w-full'>
                {markAttendance.isPending ? 'Saving…' : 'Save attendance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
