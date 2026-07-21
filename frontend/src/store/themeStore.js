import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const prefersDark =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : true

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: prefersDark ? 'dark' : 'light',
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'edupulse-theme',
    }
  )
)
