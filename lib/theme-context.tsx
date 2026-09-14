'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {}
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('zw-theme') as Theme
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
      document.documentElement.classList.toggle('dark', saved === 'dark')
      document.documentElement.dataset.theme = saved
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.dataset.theme = 'light'
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('zw-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.dataset.theme = next
  }

  if (!mounted) return <>{children}</>

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
