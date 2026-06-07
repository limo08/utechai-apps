'use client'

import { usePageLoading } from '@/components/providers/PageLoadingProvider'
import { AppIcon } from '@/components/ui/icons'
import { useTranslations } from 'next-intl'

export default function PageLoadingOverlay() {
  const { isLoading } = usePageLoading()
  const t = useTranslations('common')

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <AppIcon name="loader" className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </div>
        <div className="rounded-full bg-white/90 px-6 py-2 shadow-lg">
          <p className="text-sm font-medium text-gray-700">{t('loading')}</p>
        </div>
      </div>
    </div>
  )
}
