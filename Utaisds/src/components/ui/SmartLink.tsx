'use client'

import { ComponentProps } from 'react'
import { Link } from '@/i18n/navigation'
import { usePageLoading } from '@/components/providers/PageLoadingProvider'

type SmartLinkProps = ComponentProps<typeof Link>

export default function SmartLink({ onClick, ...props }: SmartLinkProps) {
  const { startLoading } = usePageLoading()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    startLoading()
    onClick?.(e)
  }

  return <Link {...props} onClick={handleClick} />
}
