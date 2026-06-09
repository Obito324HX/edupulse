import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'

export default function Grades() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['grades', user?.id],
    queryFn: () => api.get(`/grades/student/${user?.id}`).then(r => r.data.grades)
  })

  const getColor = (pct) => {
    if (pct >= 70) return '#22c55e'
    if (pct >= 50) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Grades</h1>
        <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>Your academic performance</p>
      </div>
      <div className='rounded-2xl overflow-hidden' style={{ border: '1px solid var(--border)' }}>
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
            ) : data?.length === 0 ? (
              <tr><td colSpan={5} className='text-center py-8' style={{ color: 'var(--text-muted)' }}>No grades yet</td></tr>
            ) : data?.map((grade, i) => (
              <tr key={grade.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--dark)' : 'var(--dark-secondary)' }}>
                <td className='px-6 py-4 text-sm font-medium' style={{ color: 'var(--text)' }}>{grade.assignment_name}</td>
                <td className='px-6 py-4'>
                  <span className='px-2 py-1 rounded-lg text-xs capitalize'
                    style={{ background: 'var(--primary)20', color: 'var(--primary)' }}>
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
  )
}
