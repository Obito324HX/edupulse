import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Grades() {
  const { user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [form, setForm] = useState({ student_id: '', course_id: '', assignment_name: '', score: '', max_score: '', type: 'assignment', comment: '' })
  const queryClient = useQueryClient()

  const canEnter = ['lecturer', 'institution_admin', 'super_admin'].includes(user?.role)

  const { data: grades, isLoading } = useQuery({
    queryKey: ['grades', user?.id],
    queryFn: () => canEnter
      ? api.get(`/grades/course/${selectedCourse}`).then(r => r.data.grades)
      : api.get(`/grades/student/${user?.id}`).then(r => r.data.grades),
    enabled: canEnter ? !!selectedCourse : true
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

  const addGrade = useMutation({
    mutationFn: (data) => api.post('/grades/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['grades'])
      toast.success('Grade added!')
      setShowModal(false)
      setForm({ student_id: '', course_id: '', assignment_name: '', score: '', max_score: '', type: 'assignment', comment: '' })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add grade')
  })

  const getColor = (pct) => {
    if (pct >= 70) return 'var(--success)'
    if (pct >= 50) return 'var(--warning)'
    return 'var(--danger)'
  }

  const inputStyle = { background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Grades</h1>
          <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>
            {canEnter ? 'Enter and manage student grades' : 'Your academic performance'}
          </p>
        </div>
        {canEnter && (
          <button onClick={() => setShowModal(true)}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-on-primary'
            style={{ background: 'var(--primary)' }}>
            <Plus size={18} /> Add Grade
          </button>
        )}
      </div>

      {/* Course filter for lecturers */}
      {canEnter && (
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          className='w-full max-w-xs px-4 py-3 rounded-xl text-sm outline-none'
          style={inputStyle}>
          <option value=''>Select a course to view grades</option>
          {courses?.map(c => (
            <option key={c.id} value={c.id}>{c.name} - {c.code}</option>
          ))}
        </select>
      )}

      <div className='rounded-2xl overflow-hidden' style={{ border: '1px solid var(--border)' }}>
        <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr style={{ background: 'var(--dark-secondary)' }}>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Assignment</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Type</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Score</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Percentage</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className='text-center py-8' style={{ color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : !grades || grades.length === 0 ? (
              <tr><td colSpan={5} className='text-center py-8' style={{ color: 'var(--text-muted)' }}>No grades yet</td></tr>
            ) : grades?.map((grade, i) => (
              <tr key={grade.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--dark)' : 'var(--dark-secondary)' }}>
                <td className='px-6 py-4 text-sm font-medium' style={{ color: 'var(--text)' }}>{grade.assignment_name}</td>
                <td className='px-6 py-4'>
                  <span className='px-2 py-1 rounded-lg text-xs capitalize'
                    style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)' }}>
                    {grade.type}
                  </span>
                </td>
                <td className='px-6 py-4 text-sm' style={{ color: 'var(--text-muted)' }}>{grade.score}/{grade.max_score}</td>
                <td className='px-6 py-4'>
                  <span className='font-semibold text-sm' style={{ color: getColor(grade.percentage) }}>
                    {grade.percentage?.toFixed(1)}%
                  </span>
                </td>
                <td className='px-6 py-4 text-sm' style={{ color: 'var(--text-muted)' }}>
                  {new Date(grade.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Add Grade Modal */}
      {showModal && (
        <div className='fixed inset-0 flex items-center justify-center z-50 p-4'
          style={{ background: 'var(--overlay)' }}>
          <div className='w-full max-w-md rounded-2xl p-8'
            style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>Add Grade</h2>
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
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Assignment Name</label>
                <input value={form.assignment_name} onChange={e => setForm({ ...form, assignment_name: e.target.value })}
                  placeholder='e.g. Midterm Exam'
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle} />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Score</label>
                  <input type='number' value={form.score} onChange={e => setForm({ ...form, score: e.target.value })}
                    placeholder='75'
                    className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle} />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Max Score</label>
                  <input type='number' value={form.max_score} onChange={e => setForm({ ...form, max_score: e.target.value })}
                    placeholder='100'
                    className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle} />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle}>
                  <option value='assignment'>Assignment</option>
                  <option value='test'>Test</option>
                  <option value='exam'>Exam</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Comment (optional)</label>
                <input value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })}
                  placeholder='Any remarks...'
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none' style={inputStyle} />
              </div>
              <button onClick={() => addGrade.mutate(form)}
                disabled={addGrade.isPending}
                className='w-full py-3 rounded-xl font-semibold text-sm text-on-primary mt-2'
                style={{ background: addGrade.isPending ? 'var(--border)' : 'var(--primary)' }}>
                {addGrade.isPending ? 'Saving...' : 'Save Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
