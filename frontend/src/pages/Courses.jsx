import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import { BookOpen } from 'lucide-react'

export default function Courses() {
  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses/').then(r => r.data.courses)
  })

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Courses</h1>
        <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>All enrolled or managed courses</p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {isLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : data?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No courses found</p>
        ) : data?.map(course => (
          <div key={course.id} className='rounded-2xl p-6'
            style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
            <div className='w-10 h-10 rounded-xl flex items-center justify-center mb-4'
              style={{ background: 'var(--primary)20' }}>
              <BookOpen size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className='font-semibold' style={{ color: 'var(--text)' }}>{course.name}</h3>
            <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>{course.code}</p>
            <div className='flex gap-2 mt-4'>
              {course.semester && (
                <span className='px-2 py-1 rounded-lg text-xs'
                  style={{ background: 'var(--primary)20', color: 'var(--primary)' }}>
                  {course.semester}
                </span>
              )}
              {course.year && (
                <span className='px-2 py-1 rounded-lg text-xs'
                  style={{ background: 'var(--secondary)20', color: 'var(--secondary)' }}>
                  {course.year}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
