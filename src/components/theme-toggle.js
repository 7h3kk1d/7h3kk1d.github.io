import React, { useState, useEffect } from 'react'

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const persistedTheme = window.localStorage.getItem('theme')
    if (persistedTheme) {
      setIsDark(persistedTheme === 'dark')
    } else {
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
      setIsDark(systemPrefersDark)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      const newTheme = isDark ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', newTheme)
      window.localStorage.setItem('theme', newTheme)
    }
  }, [isDark, mounted])

  const handleToggle = () => {
    setIsDark(!isDark)
  }

  if (!mounted) {
    return <div style={{ width: '24px', height: '24px' }} />
  }

  return (
    <button
      onClick={handleToggle}
      className={`theme-toggle ${isDark ? 'theme-toggle--dark' : ''}`}
      aria-label="Toggle theme"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <svg
        className="theme-toggle__svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sun rays */}
        <g className="theme-toggle__rays">
          <line
            x1="12"
            y1="1"
            x2="12"
            y2="3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="12"
            y1="21"
            x2="12"
            y2="23"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="4.22"
            y1="4.22"
            x2="5.64"
            y2="5.64"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="18.36"
            y1="18.36"
            x2="19.78"
            y2="19.78"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="1"
            y1="12"
            x2="3"
            y2="12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="21"
            y1="12"
            x2="23"
            y2="12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="4.22"
            y1="19.78"
            x2="5.64"
            y2="18.36"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="18.36"
            y1="5.64"
            x2="19.78"
            y2="4.22"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        {/* Sun/Moon circle */}
        <circle
          className="theme-toggle__circle"
          cx="12"
          cy="12"
          r="5"
          fill="currentColor"
        />
        {/* Moon mask */}
        <circle
          className="theme-toggle__mask"
          cx="12"
          cy="12"
          r="9"
          fill="var(--color-bg)"
        />
      </svg>
    </button>
  )
}

export default ThemeToggle
