'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { usePageLoading } from '@/components/providers/PageLoadingProvider'

export default function RouteLoadingHandler() {
  const pathname = usePathname()
  const { stopLoading } = usePageLoading()

  useEffect(() => {
    // 当路由变化完成后，自动停止加载动画
    stopLoading()
  }, [pathname, stopLoading])

  return null
}
