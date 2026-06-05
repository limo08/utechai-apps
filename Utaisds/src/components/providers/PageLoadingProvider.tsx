'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface PageLoadingContextType {
  isLoading: boolean
  startLoading: () => void
  stopLoading: () => void
}

const PageLoadingContext = createContext<PageLoadingContextType | undefined>(undefined)

export function PageLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  const startLoading = useCallback(() => {
    setIsLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
  }, [])

  return (
    <PageLoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </PageLoadingContext.Provider>
  )
}

export function usePageLoading() {
  const context = useContext(PageLoadingContext)
  if (context === undefined) {
    throw new Error('usePageLoading must be used within a PageLoadingProvider')
  }
  return context
}
