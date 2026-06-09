import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'

export default function Attendance() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', user?.id],
    queryFn: () => api.get(`/attendance/student/${user?.id}`).then(r => r.data.attendance)
  })

  const getStatusStyle = (status) => {
    if (status === 'present') return { background: '#22c55e20', color: '#22c55e' }
    if (status === 'late') return { background: '#f59e0b20', color: '#f59e0b' }
    return { background: '#ef444420', color: '#ef4444' }
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Attendance</h1>
        <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>Your attendance records</p>
      </div>
      <div className='rounded-2xl overflow-hidden' style={{ border: '1px solid var(--border)' }}>
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
            ) : data?.length === 0 ? (
              <tr><td colSpan={3} className='text-center py-8' style={{ color: 'var(--text-muted)' }}>No attendance records</td></tr>
            ) : data?.map((record, i) => (
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
  )
}
