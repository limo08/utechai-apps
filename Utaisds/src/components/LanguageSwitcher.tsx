'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { locales, localeLabels, type Locale } from '@/i18n/routing'
import ConfirmDialog from './ConfirmDialog'
import { AppIcon } from '@/components/ui/icons'
import { usePathname, useRouter } from '@/i18n/navigation'

function isSupportedLocale(locale?: string): locale is Locale {
  return locales.includes(locale as Locale)
}

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('common.language')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null)

  if (!isSupportedLocale(locale)) {
    throw new Error(`LanguageSwitcher requires locale to be one of: ${locales.join(', ')}`)
  }
  const currentLocale: Locale = locale

  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const requestLanguageSwitch = (newLocale: Locale) => {
    setIsMenuOpen(false)
    if (newLocale === currentLocale) return
    setPendingLocale(newLocale)
    setShowConfirm(true)
  }

  const confirmLanguageSwitch = () => {
    if (!pendingLocale) return
    setShowConfirm(false)
    setPendingLocale(null)
    router.replace(pathname, { locale: pendingLocale })
  }

  const cancelLanguageSwitch = () => {
    setShowConfirm(false)
    setPendingLocale(null)
  }

  return (
    <>
      <div ref={containerRef} className="relative inline-block">
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={t('select')}
          aria-expanded={isMenuOpen}
          className="inline-flex items-center justify-center
            h-9 px-3 rounded-full
            bg-[var(--glass-bg-muted)] border border-[var(--glass-stroke-soft)]
            text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]
            hover:bg-[var(--glass-bg-surface-strong)] hover:border-[var(--glass-stroke-base)]
            transition-all duration-200"
        >
          <AppIcon name="globe" className="h-[18px] w-[18px] mr-1.5" />
          <span className="text-sm font-bold tracking-wide">{localeLabels[currentLocale].short}</span>
          <AppIcon name="chevronDown" className="h-3.5 w-3.5 ml-1 text-[var(--glass-text-tertiary)]" />
        </button>

        {isMenuOpen && (
          <div className="glass-surface-modal absolute right-0 z-50 mt-2 w-52 rounded-xl p-1.5 animate-scale-in">
            {(locales as readonly Locale[]).map((loc) => {
              const isActive = loc === currentLocale
              const label = localeLabels[loc]
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => requestLanguageSwitch(loc)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${isActive
                    ? 'bg-[var(--glass-tone-info-bg)] text-[var(--glass-text-primary)]'
                    : 'text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)] hover:text-[var(--glass-text-primary)]'
                  }`}
                >
                  <span className="text-xs font-bold tracking-wide w-5 text-center">{label.short}</span>
                  <span className="font-medium">{label.native}</span>
                  {isActive && (
                    <AppIcon name="check" className="h-3.5 w-3.5 ml-auto text-[var(--glass-tone-info-fg)]" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <ConfirmDialog
        show={showConfirm}
        title={t('switchConfirmTitle')}
        message={t('switchConfirmMessage', { targetLanguage: pendingLocale ? localeLabels[pendingLocale].native : '' })}
        confirmText={t('switchConfirmAction')}
        cancelText={t('cancel', { fallback: 'Cancel' })}
        onConfirm={confirmLanguageSwitch}
        onCancel={cancelLanguageSwitch}
        type="info"
      />
    </>
  )
}