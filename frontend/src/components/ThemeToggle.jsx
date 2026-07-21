import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'

export default function ThemeToggle({ collapsed = false }) {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className='flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-200 hover:text-white'
      style={{ color: 'var(--text-muted)' }}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
      {!collapsed && (
        <span className='text-sm font-medium'>{isDark ? 'Light mode' : 'Dark mode'}</span>
      )}
    </button>
  )
}
