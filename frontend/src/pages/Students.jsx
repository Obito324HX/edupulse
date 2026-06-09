import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import { Users, Search } from 'lucide-react'
import { useState } from 'react'

export default function Students() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/users/students').then(r => r.data.students)
  })

  const filtered = data?.filter(s =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold' style={{ color: 'var(--text)' }}>Students</h1>
          <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>Manage and monitor all students</p>
        </div>
      </div>

      {/* Search */}
      <div className='flex items-center gap-3 px-4 py-3 rounded-xl'
        style={{ background: 'var(--dark-secondary)', border: '1px solid var(--border)' }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder='Search students...'
          className='flex-1 bg-transparent outline-none text-sm'
          style={{ color: 'var(--text)' }} />
      </div>

      {/* Table */}
      <div className='rounded-2xl overflow-hidden' style={{ border: '1px solid var(--border)' }}>
        <table className='w-full'>
          <thead>
            <tr style={{ background: 'var(--dark-secondary)' }}>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Name</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Email</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Phone</th>
              <th className='text-left px-6 py-4 text-sm font-medium' style={{ color: 'var(--text-muted)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className='text-center py-8' style={{ color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : filtered?.length === 0 ? (
              <tr><td colSpan={4} className='text-center py-8' style={{ color: 'var(--text-muted)' }}>No students found</td></tr>
            ) : filtered?.map((student, i) => (
              <tr key={student.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--dark)' : 'var(--dark-secondary)' }}>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white'
                      style={{ background: 'var(--primary)' }}>
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <span className='text-sm font-medium' style={{ color: 'var(--text)' }}>
                      {student.first_name} {student.last_name}
                    </span>
                  </div>
                </td>
                <td className='px-6 py-4 text-sm' style={{ color: 'var(--text-muted)' }}>{student.email}</td>
                <td className='px-6 py-4 text-sm' style={{ color: 'var(--text-muted)' }}>{student.phone || '—'}</td>
                <td className='px-6 py-4'>
                  <span className='px-3 py-1 rounded-full text-xs font-medium'
                    style={{ background: student.is_active ? '#22c55e20' : '#ef444420', color: student.is_active ? '#22c55e' : '#ef4444' }}>
                    {student.is_active ? 'Active' : 'Inactive'}
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
