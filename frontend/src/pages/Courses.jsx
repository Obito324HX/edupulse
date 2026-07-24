import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { BookOpen, Plus, X, Search, GraduationCap, Users2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export default function Courses() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
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

  const inputStyle = { background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--text)' }
  const canManage = ['super_admin', 'institution_admin'].includes(user?.role)

  const filtered = courses?.filter(c => {
    const matchesSearch = `${c.name} ${c.code}`.toLowerCase().includes(search.toLowerCase())
    const matchesDept = deptFilter === 'all' || c.department_id === Number(deptFilter)
    return matchesSearch && matchesDept
  })

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Courses</h1>
          <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>All enrolled or managed courses</p>
        </div>
        {canManage && (
          <div className='flex gap-2'>
            <button onClick={() => setShowDeptModal(true)}
              className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium'
              style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              <Plus size={18} /> Department
            </button>
            <button onClick={() => setShowCourseModal(true)}
              className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-on-primary'
              style={{ background: 'var(--primary)' }}>
              <Plus size={18} /> Course
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className='flex items-center gap-3 px-4 py-3 rounded-xl'
        style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder='Search courses...'
          className='flex-1 bg-transparent outline-none text-sm'
          style={{ color: 'var(--text)' }} />
      </div>

      {/* Department chips */}
      {departments?.length > 0 && (
        <div className='flex items-center gap-2 flex-wrap'>
          <button onClick={() => setDeptFilter('all')}
            className='px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors'
            style={{
              background: deptFilter === 'all' ? 'var(--primary)' : 'var(--dark-secondary)',
              color: deptFilter === 'all' ? 'var(--on-primary)' : 'var(--text-muted)',
              border: `1px solid ${deptFilter === 'all' ? 'transparent' : 'var(--border)'}`
            }}>
            All departments
          </button>
          {departments.map(d => (
            <button key={d.id} onClick={() => setDeptFilter(String(d.id))}
              className='px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors'
              style={{
                background: deptFilter === String(d.id) ? 'var(--primary)' : 'var(--dark-secondary)',
                color: deptFilter === String(d.id) ? 'var(--on-primary)' : 'var(--text-muted)',
                border: `1px solid ${deptFilter === String(d.id) ? 'transparent' : 'var(--border)'}`
              }}>
              {d.name}
            </button>
          ))}
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {isLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : filtered?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            {search || deptFilter !== 'all' ? 'No courses match this filter' : 'No courses found'}
          </p>
        ) : filtered?.map(course => (
          <div key={course.id} className='rounded-2xl p-6 flex flex-col'
            style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
            <div className='flex items-start justify-between mb-4'>
              <div className='w-10 h-10 rounded-xl flex items-center justify-center'
                style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                <BookOpen size={20} style={{ color: 'var(--primary)' }} />
              </div>
              {course.department_name && (
                <span className='px-2.5 py-1 rounded-lg text-[11px] font-medium'
                  style={{ background: 'var(--dark)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {course.department_name}
                </span>
              )}
            </div>
            <h3 className='font-semibold' style={{ color: 'var(--text)' }}>{course.name}</h3>
            <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>{course.code}</p>

            <div className='flex items-center gap-4 mt-4 pt-4' style={{ borderTop: '1px solid var(--border)' }}>
              <div className='flex items-center gap-1.5 text-xs' style={{ color: 'var(--text-muted)' }}>
                <GraduationCap size={14} />
                {course.lecturer_name || 'No lecturer assigned'}
              </div>
            </div>
            <div className='flex items-center justify-between mt-2'>
              <div className='flex items-center gap-1.5 text-xs' style={{ color: 'var(--text-muted)' }}>
                <Users2 size={14} />
                <span className='font-mono-data'>{course.enrolled_count ?? 0}</span> enrolled
              </div>
              <div className='flex gap-1.5'>
                {course.semester && (
                  <span className='px-2 py-1 rounded-lg text-xs'
                    style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)' }}>
                    {course.semester}
                  </span>
                )}
                {course.year && (
                  <span className='px-2 py-1 rounded-lg text-xs'
                    style={{ background: 'color-mix(in srgb, var(--secondary) 15%, transparent)', color: 'var(--secondary)' }}>
                    {course.year}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Department Modal */}
      {showDeptModal && (
        <div className='fixed inset-0 flex items-center justify-center z-50 p-4'
          style={{ background: 'var(--overlay)' }}>
          <div className='w-full max-w-md rounded-2xl p-8'
            style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>Add Department</h2>
              <button onClick={() => setShowDeptModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className='flex flex-col gap-4'>
              <div>
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Department Name</label>
                <input value={deptForm.name} onChange={e => setDeptForm({ name: e.target.value })}
                  placeholder='e.g. Computer Science'
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none'
                  style={inputStyle} />
              </div>
              <button onClick={() => createDept.mutate(deptForm)}
                disabled={createDept.isPending}
                className='w-full py-3 rounded-xl font-semibold text-sm text-on-primary'
                style={{ background: createDept.isPending ? 'var(--border)' : 'var(--primary)' }}>
                {createDept.isPending ? 'Creating...' : 'Create Department'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className='fixed inset-0 flex items-center justify-center z-50 p-4'
          style={{ background: 'var(--overlay)' }}>
          <div className='w-full max-w-md rounded-2xl p-8'
            style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold' style={{ color: 'var(--text)' }}>Add Course</h2>
              <button onClick={() => setShowCourseModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className='flex flex-col gap-4'>
              {[
                { key: 'name', label: 'Course Name', placeholder: 'e.g. Data Structures' },
                { key: 'code', label: 'Course Code', placeholder: 'e.g. CS201' },
                { key: 'semester', label: 'Semester', placeholder: 'e.g. Semester 1' },
                { key: 'year', label: 'Year', placeholder: 'e.g. 2026' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <input value={courseForm[key]} onChange={e => setCourseForm({ ...courseForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className='w-full px-4 py-3 rounded-xl text-sm outline-none'
                    style={inputStyle} />
                </div>
              ))}
              <div>
                <label className='block text-sm font-medium mb-2' style={{ color: 'var(--text-muted)' }}>Department</label>
                <select value={courseForm.department_id}
                  onChange={e => setCourseForm({ ...courseForm, department_id: e.target.value })}
                  className='w-full px-4 py-3 rounded-xl text-sm outline-none'
                  style={inputStyle}>
                  <option value=''>Select department</option>
                  {departments?.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => createCourse.mutate(courseForm)}
                disabled={createCourse.isPending}
                className='w-full py-3 rounded-xl font-semibold text-sm text-on-primary'
                style={{ background: createCourse.isPending ? 'var(--border)' : 'var(--primary)' }}>
                {createCourse.isPending ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
