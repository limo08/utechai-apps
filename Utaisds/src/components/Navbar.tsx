'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import { AppIcon } from '@/components/ui/icons'
import { Link } from '@/i18n/navigation'
import { buildAuthenticatedHomeTarget } from '@/lib/home/default-route'

export default function Navbar() {
  const { data: session, status } = useSession()
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center h-16">
          {/* 左侧：品牌 + 主菜单 */}
          <div className="flex items-center gap-6">
            <Link href={session ? buildAuthenticatedHomeTarget() : { pathname: '/' }} className="group flex items-center gap-2.5">
              <Image
                src="/logo-small.png?v=1"
                alt={tc('appName')}
                width={32}
                height={32}
                className="object-contain transition-transform group-hover:scale-110"
              />
              <span className="text-lg font-bold tracking-tight text-[var(--glass-text-primary)]">
                UTECHAI
              </span>
            </Link>
            {session && (
              <div className="flex items-center gap-1 ml-2">
                <Link
                  href={{ pathname: '/workspace' }}
                  className="text-lg text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--glass-bg-muted)]"
                >
                  <AppIcon name="monitor" className="w-[18px] h-[18px]" />
                  {t('workspace')}
                </Link>
                <Link
                  href={{ pathname: '/workspace/asset-hub' }}
                  className="text-lg text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--glass-bg-muted)]"
                >
                  <AppIcon name="folderHeart" className="w-[18px] h-[18px]" />
                  {t('assetHub')}
                </Link>
              </div>
            )}
          </div>

          {/* 中间撑开 */}
          <div className="flex-1" />

          {/* 右侧：工具按钮 */}
          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="flex items-center gap-3">
                <div className="h-4 w-16 rounded-full bg-[var(--glass-bg-muted)] animate-pulse" />
                <div className="h-4 w-16 rounded-full bg-[var(--glass-bg-muted)] animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-[var(--glass-bg-muted)] animate-pulse" />
              </div>
            ) : session ? (
              <>
                <LanguageSwitcher />
                <ThemeToggle />
                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="w-9 h-9 rounded-full bg-[var(--glass-bg-muted)] border border-[var(--glass-stroke-soft)] flex items-center justify-center text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:border-[var(--glass-stroke-base)] transition-all duration-200"
                  >
                    <AppIcon name="user" className="w-[18px] h-[18px]" />
                  </button>
                  {menuOpen && (
                    <div className="glass-surface-modal absolute right-0 z-50 mt-2 w-48 rounded-xl p-1.5 animate-scale-in">
                      <Link
                        href={{ pathname: '/profile' }}
                        onClick={() => setMenuOpen(false)}
                        className="w-full rounded-lg px-3 py-2.5 text-left text-base transition-colors flex items-center gap-2 text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)] hover:text-[var(--glass-text-primary)]"
                      >
                        <AppIcon name="settingsHex" className="w-[18px] h-[18px]" />
                        {t('profile')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                        className="w-full rounded-lg px-3 py-2.5 text-left text-base transition-colors flex items-center gap-2 text-[var(--glass-tone-danger-fg)] hover:bg-[var(--glass-tone-danger-bg)]"
                      >
                        <AppIcon name="logout" className="w-[18px] h-[18px]" />
                        {t('logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <LanguageSwitcher />
                <ThemeToggle />
                <Link
                  href={{ pathname: '/auth/signin' }}
                  className="text-base text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] font-medium transition-colors"
                >
                  {t('signin')}
                </Link>
                <Link
                  href={{ pathname: '/auth/signup' }}
                  className="glass-btn-base glass-btn-primary px-4 py-2 text-base font-medium"
                >
                  {t('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}