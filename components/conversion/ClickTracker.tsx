'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface ClickTrackerContextValue {
  clickCount: number
  trackClick: () => void
  resetClicks: () => void
  isTeaser: boolean
  isModal: boolean
}

const ClickTrackerContext = createContext<ClickTrackerContextValue>({
  clickCount: 0,
  trackClick: () => {},
  resetClicks: () => {},
  isTeaser: false,
  isModal: false,
})

const STORAGE_KEY = 'zw_click_count'

export function ClickTrackerProvider({ children }: { children: React.ReactNode }) {
  const [clickCount, setClickCount] = useState<number>(0)

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      setClickCount(parseInt(stored, 10) || 0)
    }
  }, [])

  const trackClick = useCallback(() => {
    setClickCount((prev) => {
      const next = prev + 1
      sessionStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const resetClicks = useCallback(() => {
    setClickCount(0)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  const value: ClickTrackerContextValue = {
    clickCount,
    trackClick,
    resetClicks,
    isTeaser: clickCount >= 3,
    isModal: clickCount >= 5,
  }

  return (
    <ClickTrackerContext.Provider value={value}>
      {children}
    </ClickTrackerContext.Provider>
  )
}

export function useClickTracker(): ClickTrackerContextValue {
  return useContext(ClickTrackerContext)
}
