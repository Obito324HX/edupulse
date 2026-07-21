import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'

export default function ThemeToggle({ collapsed = false, variant = 'nav' }) {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className='flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:text-[var(--text)]'
        style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className='flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-200 hover:text-[var(--text)]'
      style={{ color: 'var(--text-muted)' }}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
      {!collapsed && (
        <span className='text-sm font-medium'>{isDark ? 'Light mode' : 'Dark mode'}</span>
      )}
    </button>
  )
}
