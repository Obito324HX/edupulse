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
    queryKey: ['grades', user?.id, selectedCourse],
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

  const classStats = canEnter && grades?.length > 0 ? {
    average: grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length,
    highest: Math.max(...grades.map(g => g.percentage)),
    lowest: Math.min(...grades.map(g => g.percentage)),
  } : null

  return (
    <div className='flex flex-col gap-5'>
      <div className='page-head'>
        <div>
          <div className='eyebrow'>Manage</div>
          <h1>Grades</h1>
          <p>{canEnter ? 'Enter and manage student grades' : 'Your academic performance'}</p>
        </div>
        {canEnter && <button onClick={() => setShowModal(true)} className='btn-primary'><Plus size={16} /> Add grade</button>}
      </div>

      {canEnter && (
        <div className='field' style={{ maxWidth: 320 }}>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            <option value=''>Select a course to view grades</option>
            {courses?.map(c => <option key={c.id} value={c.id}>{c.name} - {c.code}</option>)}
          </select>
        </div>
      )}

      {classStats && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='card kpi'>
            <div className='top'><span className='top-label'>Class average</span></div>
            <div className='num' style={{ color: getColor(classStats.average) }}>{classStats.average.toFixed(1)}%</div>
          </div>
          <div className='card kpi'>
            <div className='top'><span className='top-label'>Highest</span></div>
            <div className='num' style={{ color: 'var(--success)' }}>{classStats.highest.toFixed(1)}%</div>
          </div>
          <div className='card kpi'>
            <div className='top'><span className='top-label'>Lowest</span></div>
            <div className='num' style={{ color: 'var(--danger)' }}>{classStats.lowest.toFixed(1)}%</div>
          </div>
        </div>
      )}

      <div className='card' style={{ overflowX: 'auto' }}>
        <table className='tbl'>
          <thead>
            <tr>
              {canEnter && <th>Student</th>}
              <th>Assignment</th><th>Type</th><th>Score</th><th>Average</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className='text-center py-8' style={{ color: 'var(--text-faint)' }}>Loading…</td></tr>
            ) : !grades || grades.length === 0 ? (
              <tr><td colSpan={5} className='text-center py-8' style={{ color: 'var(--text-faint)' }}>
                {canEnter && !selectedCourse ? 'Select a course to view its grades' : 'No grades yet'}
              </td></tr>
            ) : grades.map(grade => (
              <tr key={grade.id}>
                {canEnter && (
                  <td>
                    <div className='name-cell'>
                      <div className='avatar-ring good'><div className='avatar' style={{ width: 32, height: 32, fontSize: 11 }}>
                        {(grade.student_name || '—').split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div></div>
                      <div className='n'><b>{grade.student_name || '—'}</b></div>
                    </div>
                  </td>
                )}
                <td>{grade.assignment_name}</td>
                <td><span className='pill pill-neutral' style={{ textTransform: 'capitalize' }}>{grade.type}</span></td>
                <td className='mono' style={{ color: 'var(--text-faint)' }}>{grade.score}/{grade.max_score}</td>
                <td className='mono' style={{ fontWeight: 700, color: getColor(grade.percentage) }}>{grade.percentage?.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className='modal-backdrop' onClick={() => setShowModal(false)}>
          <div className='modal-card' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>Add grade</h2>
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
                <label>Assignment name</label>
                <input value={form.assignment_name} onChange={e => setForm({ ...form, assignment_name: e.target.value })} placeholder='e.g. Midterm exam' />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div className='field'>
                  <label>Score</label>
                  <input type='number' value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} placeholder='75' />
                </div>
                <div className='field'>
                  <label>Max score</label>
                  <input type='number' value={form.max_score} onChange={e => setForm({ ...form, max_score: e.target.value })} placeholder='100' />
                </div>
              </div>
              <div className='field'>
                <label>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value='assignment'>Assignment</option>
                  <option value='test'>Test</option>
                  <option value='exam'>Exam</option>
                </select>
              </div>
              <div className='field'>
                <label>Comment (optional)</label>
                <input value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder='Any remarks…' />
              </div>
              <button onClick={() => addGrade.mutate(form)} disabled={addGrade.isPending} className='btn-primary w-full'>
                {addGrade.isPending ? 'Saving…' : 'Save grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
