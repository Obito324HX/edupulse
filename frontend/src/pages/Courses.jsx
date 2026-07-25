import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { Plus, X, Search } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import PulseRing from '../components/PulseRing'

export default function Courses() {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [deptFilter, setDeptFilter] = useState('all')
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [courseForm, setCourseForm] = useState({ name: '', code: '', department_id: '', semester: '', year: '' })
  const [deptForm, setDeptForm] = useState({ name: '' })
  const queryClient = useQueryClient()

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses/').then(r => r.data.courses)
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/courses/departments').then(r => r.data.departments)
  })

  const createCourse = useMutation({
    mutationFn: (data) => api.post('/courses/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['courses'])
      toast.success('Course created!')
      setShowCourseModal(false)
      setCourseForm({ name: '', code: '', department_id: '', semester: '', year: '' })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create course')
  })

  const createDept = useMutation({
    mutationFn: (data) => api.post('/courses/departments', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['departments'])
      toast.success('Department created!')
      setShowDeptModal(false)
      setDeptForm({ name: '' })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create department')
  })

  const canManage = ['super_admin', 'institution_admin'].includes(user?.role)

  const filtered = courses?.filter(c => {
    const matchesSearch = `${c.name} ${c.code}`.toLowerCase().includes(search.toLowerCase())
    const matchesDept = deptFilter === 'all' || c.department_id === Number(deptFilter)
    return matchesSearch && matchesDept
  })

  return (
    <div className='flex flex-col gap-5'>
      <div className='page-head'>
        <div>
          <div className='eyebrow'>Manage</div>
          <h1>Courses</h1>
          <p>{courses?.length ?? 0} active courses{departments?.length ? ` across ${departments.length} departments` : ''}.</p>
        </div>
        {canManage && (
          <div className='flex gap-2'>
            <button onClick={() => setShowDeptModal(true)} className='btn-ghost'><Plus size={16} /> Department</button>
            <button onClick={() => setShowCourseModal(true)} className='btn-primary'><Plus size={16} /> New course</button>
          </div>
        )}
      </div>

      <div className='toolbar'>
        <div className='search-input'>
          <Search size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search courses or lecturers…' />
        </div>
      </div>

      {departments?.length > 0 && (
        <div className='flex items-center gap-2 flex-wrap' style={{ marginTop: -6 }}>
          <button onClick={() => setDeptFilter('all')} className={`chip${deptFilter === 'all' ? ' on' : ''}`}>All departments</button>
          {departments.map(d => (
            <button key={d.id} onClick={() => setDeptFilter(String(d.id))} className={`chip${deptFilter === String(d.id) ? ' on' : ''}`}>{d.name}</button>
          ))}
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {isLoading ? (
          <p style={{ color: 'var(--text-faint)' }}>Loading…</p>
        ) : filtered?.length === 0 ? (
          <p style={{ color: 'var(--text-faint)' }}>{search || deptFilter !== 'all' ? 'No courses match this filter' : 'No courses found'}</p>
        ) : filtered?.map(course => (
          <div key={course.id} className='card course-card'>
            <div className='tophead'>
              <div>
                <div className='code'>{course.code}</div>
                <h4>{course.name}</h4>
              </div>
              {course.average_grade != null && (
                <PulseRing value={Math.round(course.average_grade)} size={46} stroke={5} color='var(--secondary-bright)' showLabel={false} />
              )}
            </div>
            <div className='lect'>{course.lecturer_name || 'No lecturer assigned'}{course.department_name ? ` · ${course.department_name}` : ''}</div>
            <div className='meta-row'>
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{course.enrolled_count ?? 0} enrolled</span>
              <div className='flex gap-1.5'>
                {course.semester && <span className='pill pill-neutral'>{course.semester}</span>}
                {course.year && <span className='pill pill-neutral'>{course.year}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showDeptModal && (
        <div className='modal-backdrop' onClick={() => setShowDeptModal(false)}>
          <div className='modal-card' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>Add department</h2>
              <button onClick={() => setShowDeptModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className='flex flex-col gap-4'>
              <div className='field'>
                <label>Department name</label>
                <input value={deptForm.name} onChange={e => setDeptForm({ name: e.target.value })} placeholder='e.g. Computer Science' />
              </div>
              <button onClick={() => createDept.mutate(deptForm)} disabled={createDept.isPending} className='btn-primary w-full'>
                {createDept.isPending ? 'Creating…' : 'Create department'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCourseModal && (
        <div className='modal-backdrop' onClick={() => setShowCourseModal(false)}>
          <div className='modal-card' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>Add course</h2>
              <button onClick={() => setShowCourseModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className='flex flex-col gap-4'>
              {[
                { key: 'name', label: 'Course name', placeholder: 'e.g. Data Structures' },
                { key: 'code', label: 'Course code', placeholder: 'e.g. CS201' },
                { key: 'semester', label: 'Semester', placeholder: 'e.g. Term 1' },
                { key: 'year', label: 'Year', placeholder: 'e.g. 2026' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className='field'>
                  <label>{label}</label>
                  <input value={courseForm[key]} onChange={e => setCourseForm({ ...courseForm, [key]: e.target.value })} placeholder={placeholder} />
                </div>
              ))}
              <div className='field'>
                <label>Department</label>
                <select value={courseForm.department_id} onChange={e => setCourseForm({ ...courseForm, department_id: e.target.value })}>
                  <option value=''>Select department</option>
                  {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <button onClick={() => createCourse.mutate(courseForm)} disabled={createCourse.isPending} className='btn-primary w-full'>
                {createCourse.isPending ? 'Creating…' : 'Create course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
