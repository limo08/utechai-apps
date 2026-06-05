'use client'

import { SessionProvider } from "next-auth/react"
import { ToastProvider } from "@/contexts/ToastContext"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { PageLoadingProvider } from "@/components/providers/PageLoadingProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      <QueryProvider>
        <PageLoadingProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </PageLoadingProvider>
      </QueryProvider>
    </SessionProvider>
  )
}
