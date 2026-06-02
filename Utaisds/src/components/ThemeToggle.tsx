'use client'

import { useEffect, useState } from 'react'
import { AppIcon } from '@/components/ui/icons'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light'
    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
  }, [])

  const toggle = () => {
    if (!theme) return
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full
        bg-[var(--glass-bg-muted)] border border-[var(--glass-stroke-soft)]
        text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]
        hover:bg-[var(--glass-bg-surface-strong)] transition-all duration-200"
    >
      {theme ? (
        <AppIcon name={theme === 'light' ? 'moon' : 'sun'} className="h-[18px] w-[18px]" />
      ) : (
        <span className="h-[18px] w-[18px]" />
      )}
    </button>
  )
}